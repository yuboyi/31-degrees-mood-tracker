package com.degrees31.aiplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 31度文创精灵AI绘画平台主启动类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@SpringBootApplication
public class AiPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiPlatformApplication.class, args);
        System.out.println("\n🎨 31度文创精灵AI绘画平台启动成功!");
        System.out.println("📚 API文档地址: http://localhost:8080/swagger-ui.html");
        System.out.println("🚀 开始您的AI创作之旅吧!");
    }
}