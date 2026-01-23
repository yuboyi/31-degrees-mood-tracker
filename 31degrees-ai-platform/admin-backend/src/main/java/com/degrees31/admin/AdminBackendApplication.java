package com.degrees31.admin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 31度文创精灵管理后台主启动类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@SpringBootApplication
@MapperScan("com.degrees31.admin.mapper")
public class AdminBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdminBackendApplication.class, args);
        System.out.println("========================================");
        System.out.println("31度文创精灵管理后台启动成功！");
        System.out.println("管理后台地址：http://localhost:8081");
        System.out.println("========================================");
    }
}