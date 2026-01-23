package com.degrees31.aiplatform.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    /**
     * 系统健康检查
     */
    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "UP");
        result.put("service", "31度文创精灵AI绘画平台");
        result.put("version", "1.0.0");
        result.put("timestamp", LocalDateTime.now());
        result.put("message", "🎨 系统运行正常，准备开始AI创作！");
        return result;
    }

    /**
     * 版本信息
     */
    @GetMapping("/version")
    public Map<String, String> version() {
        Map<String, String> result = new HashMap<>();
        result.put("application", "31degrees-ai-platform");
        result.put("version", "1.0.0");
        result.put("description", "31度文创精灵AI绘画平台后端API服务");
        result.put("author", "31度创意团队");
        return result;
    }
}