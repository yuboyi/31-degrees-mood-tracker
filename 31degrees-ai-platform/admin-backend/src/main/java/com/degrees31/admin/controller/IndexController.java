package com.degrees31.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 管理后台首页控制器
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Controller
public class IndexController {

    /**
     * 首页
     */
    @GetMapping({"/", "/index"})
    public String index(Model model) {
        model.addAttribute("title", "31度文创精灵管理后台");
        model.addAttribute("systemName", "31度文创精灵");
        model.addAttribute("version", "1.0.0");
        return "index";
    }
    
    /**
     * 登录页面
     */
    @GetMapping("/login")
    public String login() {
        return "login";
    }
    
    /**
     * 主面板
     */
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        // 这里可以添加仪表盘数据统计
        return "dashboard";
    }
}