package com.roadmind.knowledge.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.roadmind.knowledge.entity.KnowledgeBaseEntity;
import org.apache.ibatis.annotations.Mapper;

/** 知识库数据访问；复用 MyBatis-Plus 参数绑定、分页和逻辑删除，不暴露给 Controller。 */
@Mapper
public interface KnowledgeBaseMapper extends BaseMapper<KnowledgeBaseEntity> {
}
