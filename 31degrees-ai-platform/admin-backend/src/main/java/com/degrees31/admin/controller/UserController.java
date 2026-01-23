package com.degrees31.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户管理控制器
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@Controller
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    /**
     * 用户管理页面
     */
    @GetMapping("")
    public String userList(Model model) {
        model.addAttribute("title", "用户管理");
        model.addAttribute("pageTitle", "用户管理");
        model.addAttribute("pageSubtitle", "管理和查看所有小程序用户");
        return "user/list";
    }

    /**
     * 用户详情页面
     */
    @GetMapping("/{id}")
    public String userDetail(@PathVariable Long id, Model model) {
        // 这里应该从主系统API获取用户详情
        model.addAttribute("title", "用户详情");
        model.addAttribute("pageTitle", "用户详情");
        model.addAttribute("userId", id);
        return "user/detail";
    }

    /**
     * 获取用户列表数据（Ajax接口）
     */
    @PostMapping("/list")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUserList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String vipLevel,
            @RequestParam(required = false) Integer status) {
        
        try {
            // 这里应该调用主系统的API获取用户数据
            // 现在先返回模拟数据
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "查询成功");
            
            Map<String, Object> data = new HashMap<>();
            data.put("total", 1234);
            data.put("pages", 62);
            data.put("current", page);
            data.put("size", size);
            
            // 模拟用户数据
            List<Map<String, Object>> records = List.of(
                createMockUser(1L, "张三", "NORMAL", 1, "2025-08-28 10:30:00"),
                createMockUser(2L, "李四", "VIP", 1, "2025-08-28 09:15:00"),
                createMockUser(3L, "王五", "PREMIUM", 1, "2025-08-27 14:20:00"),
                createMockUser(4L, "赵六", "NORMAL", 0, "2025-08-27 11:45:00"),
                createMockUser(5L, "钱七", "VIP", 1, "2025-08-26 16:30:00")
            );
            
            data.put("records", records);
            result.put("data", data);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取用户列表失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "查询失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 获取用户详情数据（Ajax接口）
     */
    @GetMapping("/{id}/detail")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUserDetail(@PathVariable Long id) {
        try {
            // 这里应该调用主系统的API获取用户详情
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "查询成功");
            
            Map<String, Object> user = new HashMap<>();
            user.put("id", id);
            user.put("nickname", "用户" + id);
            user.put("avatarUrl", "https://via.placeholder.com/100");
            user.put("phone", "138****" + String.format("%04d", id));
            user.put("email", "user" + id + "@example.com");
            user.put("vipLevel", id % 3 == 0 ? "VIP" : "NORMAL");
            user.put("vipExpireTime", "2025-12-31 23:59:59");
            user.put("totalRequests", 150 + id * 10);
            user.put("todayRequests", 5);
            user.put("remainingRequests", 15);
            user.put("totalWorks", 45 + id * 5);
            user.put("totalOrders", 3);
            user.put("totalAmount", 299.0);
            user.put("status", 1);
            user.put("registerTime", "2025-01-15 10:30:00");
            user.put("lastLoginTime", "2025-08-28 09:15:00");
            user.put("lastLoginIp", "192.168.1." + (100 + id));
            
            result.put("data", user);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取用户详情失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "查询失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 更新用户状态
     */
    @PostMapping("/{id}/status")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @PathVariable Long id,
            @RequestParam Integer status) {
        
        try {
            // 这里应该调用主系统的API更新用户状态
            log.info("更新用户状态，用户ID: {}, 状态: {}", id, status);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", status == 1 ? "用户启用成功" : "用户禁用成功");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("更新用户状态失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "操作失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 重置用户密码
     */
    @PostMapping("/{id}/reset-password")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> resetUserPassword(@PathVariable Long id) {
        try {
            // 这里应该调用主系统的API重置用户密码
            log.info("重置用户密码，用户ID: {}", id);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "密码重置成功");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("重置用户密码失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "操作失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 调整用户VIP等级
     */
    @PostMapping("/{id}/vip")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateUserVipLevel(
            @PathVariable Long id,
            @RequestParam String vipLevel,
            @RequestParam(required = false) String expireTime) {
        
        try {
            // 这里应该调用主系统的API更新用户VIP等级
            log.info("更新用户VIP等级，用户ID: {}, VIP等级: {}, 到期时间: {}", id, vipLevel, expireTime);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "VIP等级更新成功");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("更新用户VIP等级失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "操作失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 获取用户统计数据
     */
    @GetMapping("/statistics")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUserStatistics() {
        try {
            // 这里应该调用主系统的API获取用户统计数据
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "查询成功");
            
            Map<String, Object> data = new HashMap<>();
            data.put("totalUsers", 1234);
            data.put("activeUsers", 856);
            data.put("vipUsers", 234);
            data.put("premiumUsers", 45);
            data.put("todayRegister", 12);
            data.put("weekRegister", 78);
            data.put("monthRegister", 345);
            
            result.put("data", data);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取用户统计数据失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "查询失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 创建模拟用户数据
     */
    private Map<String, Object> createMockUser(Long id, String nickname, String vipLevel, Integer status, String registerTime) {
        Map<String, Object> user = new HashMap<>();
        user.put("id", id);
        user.put("nickname", nickname);
        user.put("avatarUrl", "https://via.placeholder.com/50");
        user.put("phone", "138****" + String.format("%04d", id));
        user.put("vipLevel", vipLevel);
        user.put("vipLevelText", getVipLevelText(vipLevel));
        user.put("status", status);
        user.put("statusText", status == 1 ? "正常" : "禁用");
        user.put("totalRequests", 100 + id * 10);
        user.put("totalWorks", 30 + id * 3);
        user.put("registerTime", registerTime);
        user.put("lastLoginTime", "2025-08-28 " + String.format("%02d:%02d:00", 8 + id % 12, id % 60));
        return user;
    }

    /**
     * 获取VIP等级文本
     */
    private String getVipLevelText(String vipLevel) {
        switch (vipLevel) {
            case "VIP":
                return "VIP会员";
            case "PREMIUM":
                return "尊享会员";
            default:
                return "普通用户";
        }
    }
}