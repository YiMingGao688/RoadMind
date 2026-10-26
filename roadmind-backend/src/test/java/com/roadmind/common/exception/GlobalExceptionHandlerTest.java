package com.roadmind.common.exception;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.roadmind.common.api.ApiResponse;
import com.roadmind.support.MySqlIntegrationTestSupport;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 通过仅测试使用的接口，验证参数校验、框架 HTTP 状态和内部错误隐藏规则。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(GlobalExceptionHandlerTest.TestController.class)
class GlobalExceptionHandlerTest extends MySqlIntegrationTestSupport {

    /** 将测试请求交给应用实际使用的 MVC 处理链。 */
    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldAcceptAValidRequestBody() throws Exception {
        mockMvc.perform(post("/test/errors/body")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"RoadMind\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("RoadMind"));
    }

    @Test
    void shouldRejectBlankRequestFields() throws Exception {
        mockMvc.perform(post("/test/errors/body")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\" \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("名称不能为空"))
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void shouldRejectMalformedJsonWithoutParserDetails() throws Exception {
        mockMvc.perform(post("/test/errors/body")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("请求参数不合法"))
                .andExpect(content().string(not(containsString("invalid-json"))));
    }

    @Test
    void shouldValidateControllerMethodParameters() throws Exception {
        mockMvc.perform(get("/test/errors/parameter").param("page", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void shouldPreserveBadRequestForParameterTypeMismatch() throws Exception {
        mockMvc.perform(get("/test/errors/parameter").param("page", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void shouldPreserveBadRequestForMissingParameters() throws Exception {
        mockMvc.perform(get("/test/errors/parameter"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void shouldPreserveNotFoundForUnknownRoutes() throws Exception {
        mockMvc.perform(get("/api/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    void shouldPreserveMethodNotAllowedAndAllowHeader() throws Exception {
        mockMvc.perform(post("/api/health"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string(HttpHeaders.ALLOW, containsString("GET")))
                .andExpect(jsonPath("$.code").value(405));
    }

    @Test
    void shouldHideUnexpectedExceptionDetails() throws Exception {
        mockMvc.perform(get("/test/errors/unexpected"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value(500))
                .andExpect(jsonPath("$.message").value("服务器内部错误，请稍后重试"))
                .andExpect(content().string(not(containsString("sensitive-debug-value"))))
                .andExpect(content().string(not(containsString("IllegalStateException"))));
    }

    @Test
    void shouldTreatInvalidReturnValuesAsServerErrors() throws Exception {
        mockMvc.perform(get("/test/errors/invalid-return"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value(500));
    }

    /**
     * 测试专用 Controller，通过显式导入启用，不参与默认组件扫描及生产打包。
     */
    @TestComponent
    @RestController
    @RequestMapping("/test/errors")
    static class TestController {

        /** 验证 Jakarta Validation 请求体约束的实际执行链。 */
        @PostMapping("/body")
        ApiResponse<String> body(@Valid @RequestBody TestRequest request) {
            return ApiResponse.success(request.name());
        }

        /** 验证 Spring MVC 内置的方法参数校验，不依赖类级别 @Validated。 */
        @GetMapping("/parameter")
        ApiResponse<Integer> parameter(@RequestParam @Min(1) int page) {
            return ApiResponse.success(page);
        }

        /** 触发未预期异常，以检查对外响应是否隐藏内部详情。 */
        @GetMapping("/unexpected")
        ApiResponse<Void> unexpected() {
            throw new IllegalStateException("sensitive-debug-value");
        }

        /** 触发返回值约束失败，确认服务端错误不会被错误转换成 HTTP 400。 */
        @NotNull
        @GetMapping("/invalid-return")
        ApiResponse<Void> invalidReturn() {
            return null;
        }
    }

    /**
     * 校验测试请求。
     *
     * @param name 测试名称，使用非空约束验证请求体字段校验
     */
    record TestRequest(@NotBlank(message = "名称不能为空") String name) {
    }
}
