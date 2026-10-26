package com.roadmind.knowledge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 创建知识库的 API 输入，长度规则沿用现有前端。
 *
 * @param name 知识库名称，去除首尾空白后必填且不超过 40 个字符
 * @param description 知识范围描述，可省略并规范化为空字符串，最多 160 个字符
 * @param category 必填的业务分类，与当前前端四个分类一致
 */
public record CreateKnowledgeBaseRequest(
        @NotBlank(message = "知识库名称不能为空") @Size(max = 40, message = "知识库名称不能超过 40 个字符") String name,
        @Size(max = 160, message = "知识库描述不能超过 160 个字符") String description,
        @NotBlank(message = "知识库分类不能为空")
        @Pattern(regexp = "日常养护|设施管理|应急安全|作业管理", message = "知识库分类不支持") String category) {
    /** 创建时统一清理首尾空白，不把客户端省略的描述持久化为 null。 */
    public CreateKnowledgeBaseRequest {
        name = name == null ? null : name.strip();
        description = description == null ? "" : description.strip();
        category = category == null ? null : category.strip();
    }
}
