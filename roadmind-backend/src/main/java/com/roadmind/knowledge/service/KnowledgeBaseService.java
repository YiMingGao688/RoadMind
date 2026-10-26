package com.roadmind.knowledge.service;

import com.roadmind.common.api.PageResponse;
import com.roadmind.knowledge.dto.CreateKnowledgeBaseRequest;
import com.roadmind.knowledge.dto.UpdateKnowledgeBaseRequest;
import com.roadmind.knowledge.vo.KnowledgeBaseVO;

/** 知识库业务边界，Controller 只依赖此接口，不访问持久层。 */
public interface KnowledgeBaseService {
    /**
     * 创建知识库，检查有效名称唯一性并持久化元数据。
     * 请求字段由 MVC 校验和 DTO 规范化；数据库唯一约束继续处理并发重名。
     *
     * @param request 已校验并清理首尾空白的创建参数
     * @return 持久化后的知识库，当前文档数为 0
     * @throws com.roadmind.common.exception.BusinessException 名称冲突时返回 409
     * @throws org.springframework.dao.DataAccessException 数据库访问失败
     */
    KnowledgeBaseVO create(CreateKnowledgeBaseRequest request);

    /**
     * 分页查询有效知识库，以更新时间、主键倒序稳定排序。
     * 名称按字面关键词匹配，分类为精确匹配；逻辑删除记录始终排除。
     *
     * @param page 从 1 开始的页码，已由 MVC 校验
     * @param size 单页数量，范围 1 到 100
     * @param keyword 可空的名称关键词，不把百分号或下划线当通配符
     * @param category 可空的业务分类
     * @return 对外分页模型，超出最后一页时 records 为空
     * @throws org.springframework.dao.DataAccessException 查询失败
     */
    PageResponse<KnowledgeBaseVO> list(int page, int size, String keyword, String category);

    /**
     * 查询单个有效知识库并映射为 VO，不返回数据库实体或逻辑删除标记。
     *
     * @param id 正数知识库主键
     * @return 存在且未删除的知识库
     * @throws com.roadmind.common.exception.BusinessException 不存在或已删除时返回 404
     * @throws org.springframework.dao.DataAccessException 查询失败
     */
    KnowledgeBaseVO detail(long id);

    /**
     * 在事务中检查资源和名称冲突，再完整修改允许编辑的业务字段。
     * 保留创建时间，不允许通过请求修改主键、删除标记或身份字段。
     *
     * @param id 正数知识库主键
     * @param request 已校验并规范化的名称、描述和分类
     * @return 更新后的知识库
     * @throws com.roadmind.common.exception.BusinessException 资源不存在时 404，重名时 409
     * @throws org.springframework.dao.DataAccessException 更新失败
     */
    KnowledgeBaseVO update(long id, UpdateKnowledgeBaseRequest request);

    /**
     * 通过 MyBatis-Plus 逻辑删除知识库，保留原始行并更新数据库时间。
     * 已删除或不存在的主键不会被当作成功，不物理删除记录。
     *
     * @param id 正数知识库主键
     * @throws com.roadmind.common.exception.BusinessException 不存在或已经删除时返回 404
     * @throws org.springframework.dao.DataAccessException 删除失败
     */
    void delete(long id);
}
