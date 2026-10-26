-- 知识库元数据。不插入演示数据，不创建模拟用户；MySQL 8.0 / 8.4 通用语法。
CREATE TABLE kb_knowledge_base (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '知识库主键',
    name VARCHAR(40) NOT NULL COMMENT '去除首尾空白后的知识库名称',
    description VARCHAR(160) NOT NULL DEFAULT '' COMMENT '知识内容范围和使用场景',
    category VARCHAR(16) NOT NULL COMMENT '日常养护、设施管理、应急安全或作业管理',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'UTC 创建时间',
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT 'UTC 最近修改时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 正常，1 已删除',
    -- NULL 不参与唯一性冲突，允许删除后重建同名知识库，且可多次删除重建。
    active_name VARCHAR(40) GENERATED ALWAYS AS (CASE WHEN deleted = 0 THEN name ELSE NULL END) STORED COMMENT '仅用于有效名称唯一约束',
    PRIMARY KEY (id),
    UNIQUE KEY uk_kb_active_name (active_name),
    KEY idx_kb_deleted_updated (deleted, updated_at, id),
    KEY idx_kb_category_deleted_updated (category, deleted, updated_at, id),
    CONSTRAINT chk_kb_deleted CHECK (deleted IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='RoadMind 知识库主表';
