package com.roadmind.knowledge.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.roadmind.common.api.PageResponse;
import com.roadmind.common.exception.BusinessException;
import com.roadmind.knowledge.dto.CreateKnowledgeBaseRequest;
import com.roadmind.knowledge.dto.UpdateKnowledgeBaseRequest;
import com.roadmind.knowledge.entity.KnowledgeBaseEntity;
import com.roadmind.knowledge.mapper.KnowledgeBaseMapper;
import com.roadmind.knowledge.service.KnowledgeBaseService;
import com.roadmind.knowledge.vo.KnowledgeBaseVO;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** 知识库业务实现，沿用 MyBatis-Plus 和现有统一异常边界。 */
@Service
@RequiredArgsConstructor
public class KnowledgeBaseServiceImpl implements KnowledgeBaseService {
    /** 仅由业务层调用的知识库数据访问入口。 */
    private final KnowledgeBaseMapper mapper;

    /** {@inheritDoc} 创建前检查名称，数据库唯一约束处理并发写入冲突，事务失败整体回滚。 */
    @Override
    @Transactional
    public KnowledgeBaseVO create(CreateKnowledgeBaseRequest request) {
        ensureNameAvailable(request.name(), null);
        KnowledgeBaseEntity entity = new KnowledgeBaseEntity();
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setCategory(request.category());
        LocalDateTime now = utcNow();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setDeleted(0);
        try {
            mapper.insert(entity);
        } catch (DuplicateKeyException ex) {
            throw duplicateName();
        }
        return toVO(entity);
    }

    /** {@inheritDoc} 使用绑定参数处理字面关键词，不允许客户端拼接 SQL 或排序字段。 */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<KnowledgeBaseVO> list(int page, int size, String keyword, String category) {
        LambdaQueryWrapper<KnowledgeBaseEntity> query = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            String escaped = keyword.strip().replace("=", "==").replace("%", "=%").replace("_", "=_");
            query.apply("name LIKE {0} ESCAPE '='", "%" + escaped + "%");
        }
        query.eq(StringUtils.hasText(category), KnowledgeBaseEntity::getCategory, category)
                .orderByDesc(KnowledgeBaseEntity::getUpdatedAt).orderByDesc(KnowledgeBaseEntity::getId);
        Page<KnowledgeBaseEntity> result = mapper.selectPage(new Page<>(page, size), query);
        return new PageResponse<>(result.getRecords().stream().map(this::toVO).toList(), result.getTotal(), page, size);
    }

    /** {@inheritDoc} 普通主键查询由 @TableLogic 自动排除已删除记录。 */
    @Override
    @Transactional(readOnly = true)
    public KnowledgeBaseVO detail(long id) {
        return toVO(findActive(id));
    }

    /** {@inheritDoc} 更新仅写允许编辑的字段，并检查并发删除和数据库重名约束。 */
    @Override
    @Transactional
    public KnowledgeBaseVO update(long id, UpdateKnowledgeBaseRequest request) {
        findActive(id);
        ensureNameAvailable(request.name(), id);
        KnowledgeBaseEntity changes = new KnowledgeBaseEntity();
        changes.setId(id);
        changes.setName(request.name());
        changes.setDescription(request.description());
        changes.setCategory(request.category());
        changes.setUpdatedAt(utcNow());
        try {
            if (mapper.updateById(changes) == 0) throw notFound();
        } catch (DuplicateKeyException ex) {
            throw duplicateName();
        }
        return toVO(findActive(id));
    }

    /** {@inheritDoc} 单条逻辑更新影响 0 行时返回 404，重复删除不会伪装成功。 */
    @Override
    @Transactional
    public void delete(long id) {
        if (mapper.deleteById(id) == 0) throw notFound();
    }

    /**
     * 查询有效资源，不存在和已逻辑删除使用同一 404 规则。
     *
     * @param id 知识库主键
     * @return 持久化实体，仅供业务层使用
     * @throws BusinessException 无有效记录时抛出 404
     */
    private KnowledgeBaseEntity findActive(long id) {
        KnowledgeBaseEntity entity = mapper.selectById(id);
        if (entity == null) throw notFound();
        return entity;
    }

    /**
     * 按数据库排序规则检查有效名称；更新时排除当前主键，允许保持原名称。
     * 此检查提供友好提示，并发竞争继续由数据库 uk_kb_active_name 约束兜底。
     *
     * @param name 规范化后的知识库名称
     * @param excludedId 更新时需要排除的主键，创建时为 null
     * @throws BusinessException 已有其他有效知识库使用该名称时抛出 409
     */
    private void ensureNameAvailable(String name, Long excludedId) {
        LambdaQueryWrapper<KnowledgeBaseEntity> query = new LambdaQueryWrapper<KnowledgeBaseEntity>()
                .eq(KnowledgeBaseEntity::getName, name)
                .ne(excludedId != null, KnowledgeBaseEntity::getId, excludedId);
        if (mapper.selectCount(query) > 0) throw duplicateName();
    }

    /**
     * 映射公开模型，主键转字符串，UTC 本地时间转 Instant，文档模块未实现时返回真实的 0。
     *
     * @param entity 已存在的知识库实体
     * @return 不含逻辑删除和内部生成列的公开信息
     */
    private KnowledgeBaseVO toVO(KnowledgeBaseEntity entity) {
        return new KnowledgeBaseVO(entity.getId().toString(), entity.getName(), entity.getDescription(),
                entity.getCategory(), 0, entity.getCreatedAt().toInstant(ZoneOffset.UTC),
                entity.getUpdatedAt().toInstant(ZoneOffset.UTC));
    }

    /** 与 MySQL DATETIME(3) 精度一致的 UTC 时间，避免响应和重新查询出现舍入差异。 */
    private LocalDateTime utcNow() {
        return LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MILLIS);
    }

    /** 资源查找、更新以及删除共享同一不存在错误，避免各入口提示不一致。 */
    private BusinessException notFound() {
        return new BusinessException(HttpStatus.NOT_FOUND, "知识库不存在或已删除");
    }

    /** 名称预检查和数据库并发冲突共享相同的业务错误，不公开底层 SQL。 */
    private BusinessException duplicateName() {
        return new BusinessException(HttpStatus.CONFLICT, "已存在同名知识库，请使用其他名称");
    }
}
