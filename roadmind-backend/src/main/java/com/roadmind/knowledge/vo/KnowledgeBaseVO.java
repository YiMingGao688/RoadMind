package com.roadmind.knowledge.vo;

import java.time.Instant;

/**
 * 对外知识库信息，隔离数据库主键类型和逻辑删除字段。
 *
 * @param id 数据库主键的十进制字符串，避免前端数字精度丢失
 * @param name 知识库名称
 * @param description 知识范围描述，无描述时为空字符串
 * @param category 业务分类
 * @param documentCount 真实文档数；本阶段未接入文档业务，固定为 0
 * @param createdAt UTC 创建时间
 * @param updatedAt UTC 最近更新时间
 */
public record KnowledgeBaseVO(String id, String name, String description, String category,
                              long documentCount, Instant createdAt, Instant updatedAt) {
}
