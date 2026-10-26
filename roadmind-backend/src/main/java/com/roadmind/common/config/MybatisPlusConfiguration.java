package com.roadmind.common.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.roadmind.common.api.PageResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** MySQL 分页配置，只注册本阶段实际使用的分页插件。 */
@Configuration
public class MybatisPlusConfiguration {
    /**
     * 保持越界页返回空结果，并在 SQL 层限制单页数量。
     *
     * @return 使用 MySQL 方言的 MyBatis-Plus 拦截器
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        PaginationInnerInterceptor pagination = new PaginationInnerInterceptor(DbType.MYSQL);
        pagination.setMaxLimit((long) PageResponse.MAX_SIZE);
        pagination.setOverflow(false);
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(pagination);
        return interceptor;
    }
}
