package com.roadmind.knowledge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 修改知识库的完整业务字段，不接收主键、时间、删除标记或用户身份。
 *
 * @param name 修改后的名称，去除首尾空白后必填且不超过 40 个字符
 * @param description 修改后的知识范围，省略时写为空字符串，最多 160 个字符
 * @param category 修改后的业务分类，仅允许现有四个分类
 */
public record UpdateKnowledgeBaseRequest(
        @NotBlank(message = "知识库名称不能为空") @Size(max = 40, message = "知识库名称不能超过 40 个字符") String name,
        @Size(max = 160, message = "知识库描述不能超过 160 个字符") String description,
        @NotBlank(message = "知识库分类不能为空")
        @Pattern(regexp = "日常养护|设施管理|应急安全|作业管理", message = "知识库分类不支持") String category) {
    /** 与创建保持相同的文本规范化规则。 */
    public UpdateKnowledgeBaseRequest {
        name = name == null ? null : name.strip();
        description = description == null ? "" : description.strip();
        category = category == null ? null : category.strip();
    }
}
