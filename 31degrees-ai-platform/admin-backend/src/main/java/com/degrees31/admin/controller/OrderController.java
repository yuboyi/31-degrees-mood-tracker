package com.degrees31.admin.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 订单管理控制器
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@Controller
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    /**
     * 订单管理页面
     */
    @GetMapping("")
    public String orderList(Model model) {
        model.addAttribute("title", "订单管理");
        model.addAttribute("pageTitle", "订单管理");
        model.addAttribute("pageSubtitle", "管理所有VIP订单和支付记录");
        return "order/list";
    }

    /**
     * 获取订单列表数据
     */
    @PostMapping("/list")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getOrderList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String orderType) {
        
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "查询成功");
            
            Map<String, Object> data = new HashMap<>();
            data.put("total", 456);
            data.put("pages", 23);
            data.put("current", page);
            data.put("size", size);
            
            // 模拟订单数据
            List<Map<String, Object>> records = List.of(
                createMockOrder(1L, "202508280001", "VIP月卡", 29.90, "PAID", "2025-08-28 10:30:00"),
                createMockOrder(2L, "202508280002", "VIP年卡", 298.00, "PAID", "2025-08-28 09:15:00"),
                createMockOrder(3L, "202508280003", "尊享月卡", 69.90, "PENDING", "2025-08-27 14:20:00"),
                createMockOrder(4L, "202508280004", "VIP月卡", 29.90, "CANCELLED", "2025-08-27 11:45:00"),
                createMockOrder(5L, "202508280005", "尊享年卡", 688.00, "REFUNDED", "2025-08-26 16:30:00")
            );
            
            data.put("records", records);
            result.put("data", data);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取订单列表失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "查询失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 获取订单详情
     */
    @GetMapping("/{id}/detail")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getOrderDetail(@PathVariable Long id) {
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "查询成功");
            
            Map<String, Object> order = new HashMap<>();
            order.put("id", id);
            order.put("orderNo", "202508280001");
            order.put("userId", 123L);
            order.put("userNickname", "用户" + id);
            order.put("productName", "VIP月卡");
            order.put("productType", "VIP");
            order.put("originalPrice", 39.90);
            order.put("discountAmount", 10.00);
            order.put("finalAmount", 29.90);
            order.put("payMethod", "微信支付");
            order.put("payTransactionId", "wx2025082810300012345");
            order.put("status", "PAID");
            order.put("statusText", "已支付");
            order.put("createTime", "2025-08-28 10:30:00");
            order.put("payTime", "2025-08-28 10:30:15");
            order.put("validFrom", "2025-08-28 10:30:15");
            order.put("validTo", "2025-09-28 10:30:15");
            order.put("remark", "首次购买优惠10元");
            
            result.put("data", order);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取订单详情失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "查询失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 处理退款
     */
    @PostMapping("/{id}/refund")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> refundOrder(
            @PathVariable Long id,
            @RequestParam String reason) {
        
        try {
            log.info("处理订单退款，订单ID: {}, 退款原因: {}", id, reason);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "退款处理成功");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("处理订单退款失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "退款失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 获取订单统计数据
     */
    @GetMapping("/statistics")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getOrderStatistics() {
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "查询成功");
            
            Map<String, Object> data = new HashMap<>();
            data.put("totalOrders", 456);
            data.put("paidOrders", 389);
            data.put("pendingOrders", 32);
            data.put("cancelledOrders", 23);
            data.put("refundedOrders", 12);
            data.put("todayRevenue", 1580.50);
            data.put("monthRevenue", 45670.80);
            data.put("totalRevenue", 156789.60);
            
            result.put("data", data);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("获取订单统计数据失败", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "查询失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    /**
     * 创建模拟订单数据
     */
    private Map<String, Object> createMockOrder(Long id, String orderNo, String productName, 
                                               Double amount, String status, String createTime) {
        Map<String, Object> order = new HashMap<>();
        order.put("id", id);
        order.put("orderNo", orderNo);
        order.put("userId", 100 + id);
        order.put("userNickname", "用户" + (100 + id));
        order.put("productName", productName);
        order.put("amount", amount);
        order.put("status", status);
        order.put("statusText", getOrderStatusText(status));
        order.put("payMethod", "微信支付");
        order.put("createTime", createTime);
        return order;
    }

    /**
     * 获取订单状态文本
     */
    private String getOrderStatusText(String status) {
        switch (status) {
            case "PENDING": return "待支付";
            case "PAID": return "已支付";
            case "CANCELLED": return "已取消";
            case "REFUNDED": return "已退款";
            case "EXPIRED": return "已过期";
            default: return "未知状态";
        }
    }
}