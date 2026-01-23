package com.degrees31.admin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security 安全配置
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * 安全过滤器链配置
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF（开发阶段）
            .csrf(csrf -> csrf.disable())
            
            // 配置请求授权
            .authorizeHttpRequests(authz -> authz
                // 允许访问静态资源和登录页面
                .requestMatchers("/login", "/css/**", "/js/**", "/images/**", 
                                "/favicon.ico", "/error", "/druid/**").permitAll()
                // 其他请求需要认证
                .anyRequest().authenticated()
            )
            
            // 配置登录
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/login")
                .usernameParameter("username")
                .passwordParameter("password")
                .defaultSuccessUrl("/", true)
                .failureUrl("/login?error=true")
                .permitAll()
            )
            
            // 配置登出
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            )
            
            // 配置会话管理
            .sessionManagement(session -> session
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
            );
            
        return http.build();
    }

    /**
     * 密码编码器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}