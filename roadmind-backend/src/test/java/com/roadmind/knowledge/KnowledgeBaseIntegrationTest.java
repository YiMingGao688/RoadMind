package com.roadmind.knowledge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.instanceOf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.roadmind.support.MySqlIntegrationTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * 通过真实 MVC → Service → MyBatis-Plus → MySQL 验证知识库闭环。
 * 每个测试在独立 roadmind_test 库中的事务内执行，完成后回滚业务行。
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class KnowledgeBaseIntegrationTest extends MySqlIntegrationTestSupport {
    /** 实际 MVC 请求执行器，不替换 Service 或 Mapper。 */
    @Autowired
    private MockMvc mvc;
    /** 仅用于验证物理行、逻辑删除和 Flyway 迁移结果。 */
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void shouldApplyVersionedMigrationToUtf8mb4Database() {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM flyway_schema_history WHERE version='1' AND success=1", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT CCSA.character_set_name FROM information_schema.TABLES T JOIN information_schema.COLLATION_CHARACTER_SET_APPLICABILITY CCSA ON T.table_collation=CCSA.collation_name WHERE T.table_schema=DATABASE() AND T.table_name='kb_knowledge_base'", String.class)).isEqualTo("utf8mb4");
    }

    @Test
    void shouldPersistCreateReadUpdateAndLogicalDelete() throws Exception {
        String id = create("路面巡查资料", "原始描述", "日常养护");
        assertThat(jdbc.queryForObject("SELECT name FROM kb_knowledge_base WHERE id=?", String.class, id)).isEqualTo("路面巡查资料");
        mvc.perform(get("/api/knowledge-bases/{id}", id))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(id))
                .andExpect(jsonPath("$.data.documentCount").value(0))
                .andExpect(jsonPath("$.data.deleted").doesNotExist());
        String createdAt = jdbc.queryForObject("SELECT CAST(created_at AS CHAR) FROM kb_knowledge_base WHERE id=?", String.class, id);
        mvc.perform(put("/api/knowledge-bases/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content(body("桥涵巡查资料", "修改后的描述", "设施管理")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.name").value("桥涵巡查资料"))
                .andExpect(jsonPath("$.data.category").value("设施管理"));
        assertThat(jdbc.queryForObject("SELECT CAST(created_at AS CHAR) FROM kb_knowledge_base WHERE id=?", String.class, id)).isEqualTo(createdAt);
        mvc.perform(delete("/api/knowledge-bases/{id}", id)).andExpect(status().isOk()).andExpect(jsonPath("$.code").value(0));
        assertThat(jdbc.queryForObject("SELECT deleted FROM kb_knowledge_base WHERE id=?", Integer.class, id)).isEqualTo(1);
        mvc.perform(get("/api/knowledge-bases/{id}", id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/knowledge-bases").param("keyword", "桥涵巡查资料"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(0));
    }

    @Test
    void shouldNormalizeWhitespaceAndPermitEmptyDescription() throws Exception {
        String response = mvc.perform(post("/api/knowledge-bases").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"  雨季巡查  \",\"category\":\"  日常养护  \"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.name").value("雨季巡查"))
                .andExpect(jsonPath("$.data.description").value(""))
                .andExpect(jsonPath("$.data.id", instanceOf(String.class)))
                .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(response, "$.data.id");
        assertThat(jdbc.queryForObject("SELECT description FROM kb_knowledge_base WHERE id=?", String.class, id)).isEmpty();
    }

    @Test
    void shouldSearchAndPaginateUsingStableDescendingOrder() throws Exception {
        create("分页样本 A", "", "设施管理");
        String second = create("分页样本 B", "", "日常养护");
        String third = create("分页样本 C", "", "日常养护");
        mvc.perform(get("/api/knowledge-bases").param("keyword", "分页样本").param("page", "1").param("size", "2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.records.length()").value(2))
                .andExpect(jsonPath("$.data.records[0].id").value(third))
                .andExpect(jsonPath("$.data.records[1].id").value(second));
        mvc.perform(get("/api/knowledge-bases").param("keyword", "分页样本").param("category", "日常养护").param("size", "1").param("page", "2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.records[0].id").value(second));
        mvc.perform(get("/api/knowledge-bases").param("keyword", "分页样本").param("page", "99"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.records").isEmpty());
    }

    @Test
    void shouldTreatPercentUnderscoreAndSqlTextAsLiteralKeywords() throws Exception {
        create("特殊%_标记资料", "", "作业管理");
        create("特殊普通标记资料", "", "作业管理");
        mvc.perform(get("/api/knowledge-bases").param("keyword", "%_"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(1));
        mvc.perform(get("/api/knowledge-bases").param("keyword", "' OR 1=1 --"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(0));
    }

    @Test
    void shouldRejectActiveDuplicateNameAndAllowMultipleDeleteRecreateCycles() throws Exception {
        for (int cycle = 0; cycle < 3; cycle++) {
            String id = create("可重复重建的知识库", "", "日常养护");
            mvc.perform(post("/api/knowledge-bases").contentType(MediaType.APPLICATION_JSON)
                            .content(body("可重复重建的知识库", "", "日常养护")))
                    .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value(409));
            mvc.perform(delete("/api/knowledge-bases/{id}", id)).andExpect(status().isOk());
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM kb_knowledge_base WHERE name=? AND deleted=1", Integer.class, "可重复重建的知识库")).isEqualTo(3);
    }

    @Test
    void shouldPermitKeepingOwnNameButRejectRenamingToAnotherActiveName() throws Exception {
        String first = create("独立知识库 A", "", "日常养护");
        create("独立知识库 B", "", "日常养护");
        mvc.perform(put("/api/knowledge-bases/{id}", first).contentType(MediaType.APPLICATION_JSON).content(body("独立知识库 A", "更新描述", "作业管理")))
                .andExpect(status().isOk());
        mvc.perform(put("/api/knowledge-bases/{id}", first).contentType(MediaType.APPLICATION_JSON).content(body("独立知识库 B", "", "作业管理")))
                .andExpect(status().isConflict());
        assertThat(jdbc.queryForObject("SELECT name FROM kb_knowledge_base WHERE id=?", String.class, first)).isEqualTo("独立知识库 A");
    }

    @Test
    void shouldReturnNotFoundForAbsentOrAlreadyDeletedResources() throws Exception {
        mvc.perform(get("/api/knowledge-bases/9223372036854775807")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/knowledge-bases/9223372036854775807")).andExpect(status().isNotFound());
        mvc.perform(put("/api/knowledge-bases/9223372036854775807").contentType(MediaType.APPLICATION_JSON).content(body("不存在的知识库", "", "日常养护")))
                .andExpect(status().isNotFound());
        String id = create("已删除样本", "", "设施管理");
        mvc.perform(delete("/api/knowledge-bases/{id}", id)).andExpect(status().isOk());
        mvc.perform(delete("/api/knowledge-bases/{id}", id)).andExpect(status().isNotFound());
        mvc.perform(put("/api/knowledge-bases/{id}", id).contentType(MediaType.APPLICATION_JSON).content(body("无法修改", "", "设施管理")))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectInvalidPaginationCategoryAndIdentifier() throws Exception {
        for (String value : new String[]{"0", "-1", "abc"}) {
            mvc.perform(get("/api/knowledge-bases").param("page", value)).andExpect(status().isBadRequest());
        }
        for (String value : new String[]{"0", "-1", "101"}) {
            mvc.perform(get("/api/knowledge-bases").param("size", value)).andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/knowledge-bases").param("category", "未知分类")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/knowledge-bases").param("keyword", "长".repeat(41))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/knowledge-bases/0")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/knowledge-bases/not-an-id")).andExpect(status().isBadRequest());
    }

    @Test
    void shouldValidateNameDescriptionAndCategoryBeforeWriting() throws Exception {
        for (String name : new String[]{"   ", "长".repeat(41)}) {
            mvc.perform(post("/api/knowledge-bases").contentType(MediaType.APPLICATION_JSON).content(body(name, "", "日常养护")))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/knowledge-bases").contentType(MediaType.APPLICATION_JSON).content(body("测试输入校验", "长".repeat(161), "日常养护")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/knowledge-bases").contentType(MediaType.APPLICATION_JSON).content(body("测试输入校验", "", "未知分类")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/knowledge-bases").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM kb_knowledge_base WHERE name=?", Integer.class, "测试输入校验")).isZero();
    }

    /** 创建真实测试行，并验证 API 主键为字符串和文档数量为 0。 */
    private String create(String name, String description, String category) throws Exception {
        String response = mvc.perform(post("/api/knowledge-bases").contentType(MediaType.APPLICATION_JSON).content(body(name, description, category)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.id", instanceOf(String.class)))
                .andExpect(jsonPath("$.data.documentCount").value(0))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(response, "$.data.id");
    }

    /** 输入仅使用本测试定义的安全样本文本，避免依赖特定 JSON 序列化器版本。 */
    private String body(String name, String description, String category) {
        return "{\"name\":\"%s\",\"description\":\"%s\",\"category\":\"%s\"}".formatted(name, description, category);
    }
}
