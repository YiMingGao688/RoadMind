package com.roadmind.common.api;

import java.util.List;

/**
 * 隔离 MyBatis-Plus 内部分页模型的公开分页响应。
 *
 * @param records 当前页记录，不包含已逻辑删除的数据
 * @param total 符合当前筛选条件的总记录数
 * @param page 从 1 开始的请求页码
 * @param size 当前请求的单页数量
 * @param <T> 对外返回的记录类型
 */
public record PageResponse<T>(List<T> records, long total, int page, int size) {
    /** 业务 API 统一单页上限，同时用于 MVC 校验和持久层分页保护。 */
    public static final int MAX_SIZE = 100;
}
