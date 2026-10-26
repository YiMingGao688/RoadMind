package com.roadmind.knowledge.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/** 知识库持久化实体，仅在 Service / Mapper 内使用，不直接作为 API 返回。 */
@Getter
@Setter
@TableName("kb_knowledge_base")
public class KnowledgeBaseEntity {
    /** MySQL 自增主键，对外转换为字符串避免 JavaScript 整数精度问题。 */
    @TableId(type = IdType.AUTO)
    private Long id;
    /** 知识库名称，去除首尾空白后最多 40 个字符，有效记录之间唯一。 */
    private String name;
    /** 知识内容范围，可为空字符串，最多 160 个字符。 */
    private String description;
    /** 业务分类，与当前前端的四种分类保持一致。 */
    private String category;
    /** UTC 创建时间，创建后不通过业务更新修改。 */
    private LocalDateTime createdAt;
    /** UTC 最近更新时间，更新和删除操作都会刷新。 */
    private LocalDateTime updatedAt;
    /** 逻辑删除标记；MyBatis-Plus 的普通查询自动排除 deleted=1。 */
    @TableLogic(value = "0", delval = "1")
    private Integer deleted;
}
