package com.roadmind.knowledge.controller;

import com.roadmind.common.api.ApiResponse;
import com.roadmind.common.api.PageResponse;
import com.roadmind.knowledge.dto.CreateKnowledgeBaseRequest;
import com.roadmind.knowledge.dto.UpdateKnowledgeBaseRequest;
import com.roadmind.knowledge.service.KnowledgeBaseService;
import com.roadmind.knowledge.vo.KnowledgeBaseVO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 知识库 REST 接口，只负责协议和参数校验，所有持久化由 Service 执行。 */
@RestController
@RequestMapping("/api/knowledge-bases")
@RequiredArgsConstructor
public class KnowledgeBaseController {
    /** 知识库业务边界，不直接持有 Mapper。 */
    private final KnowledgeBaseService service;

    /** 查询未删除知识库；页码从 1 开始、单页最多 100 条，不接收客户端 SQL 排序表达式。 */
    @GetMapping
    public ApiResponse<PageResponse<KnowledgeBaseVO>> list(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "8") @Min(1) @Max(PageResponse.MAX_SIZE) int size,
            @RequestParam(required = false) @Size(max = 40) String keyword,
            @RequestParam(required = false) @Pattern(regexp = "|日常养护|设施管理|应急安全|作业管理") String category) {
        return ApiResponse.success(service.list(page, size, keyword, category));
    }

    /** 查询有效资源详情，不存在或已删除返回统一 404。 */
    @GetMapping("/{id}")
    public ApiResponse<KnowledgeBaseVO> detail(@PathVariable @Min(1) long id) {
        return ApiResponse.success(service.detail(id));
    }

    /** 校验输入并创建元数据，成功返回 HTTP 201 和统一响应。 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<KnowledgeBaseVO> create(@Valid @RequestBody CreateKnowledgeBaseRequest request) {
        return ApiResponse.success(service.create(request));
    }

    /** 完整修改名称、描述和分类，不允许修改身份、时间或删除标记。 */
    @PutMapping("/{id}")
    public ApiResponse<KnowledgeBaseVO> update(@PathVariable @Min(1) long id,
                                               @Valid @RequestBody UpdateKnowledgeBaseRequest request) {
        return ApiResponse.success(service.update(id, request));
    }

    /** 仅逻辑删除；保留统一 JSON 响应，重复删除返回 404。 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable @Min(1) long id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
