package com.degrees31.aiplatform.controller;

import com.degrees31.aiplatform.dto.ApiResponse;
import com.degrees31.aiplatform.entity.VipOrder;
import com.degrees31.aiplatform.repository.VipOrderRepository;
import com.degrees31.aiplatform.service.WeChatPayService;
import com.degrees31.aiplatform.util.JwtUtil;
import com.wechat.pay.java.service.payments.jsapi.model.PrepayWithRequestPaymentResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
/**
 * REST controller that exposes membership order operations for the 31 Degrees platform.
 */
@Slf4j
@RestController
@RequestMapping("/vip")
@RequiredArgsConstructor
public class VipOrderController {

    private final WeChatPayService weChatPayService;
    private final VipOrderRepository vipOrderRepository;
    private final JwtUtil jwtUtil;

    /**
     * Create a VIP order and return the WeChat JSAPI payment payload.
     */
    @PostMapping("/order/create")
    public ApiResponse<Map<String, Object>> createVipOrder(
            @RequestBody Map<String, Object> requestBody,
            HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("Please sign in first");
            }

            String vipType = (String) requestBody.get("vipType");
            Integer durationMonths = requestBody.get("durationMonths") instanceof Number
                    ? ((Number) requestBody.get("durationMonths")).intValue()
                    : null;
            String openid = (String) requestBody.get("openid");

            if (vipType == null || durationMonths == null || openid == null || durationMonths <= 0) {
                return ApiResponse.badRequest("Required parameters are missing or invalid");
            }

            VipOrder order = createOrder(userId, vipType, durationMonths);
            vipOrderRepository.save(order);

            PrepayWithRequestPaymentResponse payResponse = weChatPayService.createPayOrder(order, openid);

            Map<String, Object> result = new HashMap<>();
            result.put("orderId", order.getId());
            result.put("orderNo", order.getOrderNo());
            result.put("amount", order.getFinalAmount());
            result.put("paymentInfo", payResponse);

            log.info("Created VIP order successfully. userId={}, orderNo={}", userId, order.getOrderNo());
            return ApiResponse.success("Order created", result);
        } catch (Exception e) {
            log.error("Failed to create VIP order", e);
            return ApiResponse.error("Unable to create order: " + e.getMessage());
        }
    }

    /**
 * REST controller that exposes membership order operations for the 31 Degrees platform.
 */
    @GetMapping("/order/{orderNo}/status")
    public ApiResponse<Map<String, Object>> queryOrderStatus(
            @PathVariable String orderNo,
            HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("Please sign in first");
            }

            VipOrder order = vipOrderRepository.findByOrderNo(orderNo);
            if (order == null || !Objects.equals(order.getUserId(), userId)) {
                return ApiResponse.notFound("Order not found");
            }

            Map<String, Object> result = new HashMap<>();
            result.put("orderNo", order.getOrderNo());
            result.put("status", order.getStatus());
            result.put("statusText", getOrderStatusText(order.getStatus()));
            result.put("amount", order.getFinalAmount());
            result.put("productName", order.getProductName());
            result.put("createTime", order.getCreatedTime());
            result.put("payTime", order.getPayTime());
            result.put("validFrom", order.getValidFrom());
            result.put("validTo", order.getValidTo());

            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("Failed to query order status", e);
            return ApiResponse.error("Unable to query order: " + e.getMessage());
        }
    }

    /**
 * REST controller that exposes membership order operations for the 31 Degrees platform.
 */
    @GetMapping("/orders")
    public ApiResponse<List<Map<String, Object>>> getUserOrders(HttpServletRequest request) {
        try {
            Long userId = getCurrentUserId(request);
            if (userId == null) {
                return ApiResponse.unauthorized("Please sign in first");
            }

            List<VipOrder> orders = vipOrderRepository.findByUserIdAndDeletedFalseOrderByCreatedTimeDesc(userId);
            List<Map<String, Object>> result = orders.stream().map(order -> {
                Map<String, Object> orderInfo = new HashMap<>();
                orderInfo.put("id", order.getId());
                orderInfo.put("orderNo", order.getOrderNo());
                orderInfo.put("productName", order.getProductName());
                orderInfo.put("vipType", order.getVipType());
                orderInfo.put("durationMonths", order.getDurationMonths());
                orderInfo.put("originalPrice", order.getOriginalPrice());
                orderInfo.put("discountAmount", order.getDiscountAmount());
                orderInfo.put("finalAmount", order.getFinalAmount());
                orderInfo.put("status", order.getStatus());
                orderInfo.put("statusText", getOrderStatusText(order.getStatus()));
                orderInfo.put("createTime", order.getCreatedTime());
                orderInfo.put("payTime", order.getPayTime());
                orderInfo.put("validFrom", order.getValidFrom());
                orderInfo.put("validTo", order.getValidTo());
                return orderInfo;
            }).toList();

            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("Failed to fetch user order list", e);
            return ApiResponse.error("Unable to fetch order list: " + e.getMessage());
        }
    }

    /**
 * REST controller that exposes membership order operations for the 31 Degrees platform.
 */
    @PostMapping("/pay/notify")
    public String paymentNotify(@RequestBody String notifyData) {
        try {
            log.info("Received WeChat Pay callback: {}", notifyData);
            // TODO: verify signature, parse the payload, and update order status accordingly.
            return "SUCCESS";
        } catch (Exception e) {
            log.error("Failed to handle WeChat Pay notification", e);
            return "FAIL";
        }
    }

    /**
 * REST controller that exposes membership order operations for the 31 Degrees platform.
 */
    @GetMapping("/pricing")
    public ApiResponse<Map<String, Object>> getVipPricing() {
        try {
            Map<String, Object> pricing = new HashMap<>();

            Map<String, Object> vipPricing = new HashMap<>();
            vipPricing.put("month1", Map.of("price", 29.90, "originalPrice", 39.90, "discount", "Launch offer"));
            vipPricing.put("month3", Map.of("price", 79.90, "originalPrice", 119.70, "discount", "Quarterly bundle"));
            vipPricing.put("month12", Map.of("price", 298.00, "originalPrice", 478.80, "discount", "Annual savings"));

            Map<String, Object> premiumPricing = new HashMap<>();
            premiumPricing.put("month1", Map.of("price", 69.90, "originalPrice", 89.90, "discount", "Launch offer"));
            premiumPricing.put("month3", Map.of("price", 199.90, "originalPrice", 269.70, "discount", "Quarterly bundle"));
            premiumPricing.put("month12", Map.of("price", 688.00, "originalPrice", 1078.80, "discount", "Annual savings"));

            pricing.put("VIP", vipPricing);
            pricing.put("PREMIUM", premiumPricing);

            Map<String, Object> benefits = new HashMap<>();
            benefits.put("VIP", List.of(
                    "Up to 100 AI generations per day",
                    "Priority support",
                    "High-quality export presets",
                    "Exclusive template library"));
            benefits.put("PREMIUM", List.of(
                    "Up to 300 AI generations per day",
                    "Dedicated success manager",
                    "High-resolution export",
                    "Unlimited commercial license",
                    "Early-access features",
                    "Priority job scheduling"));

            Map<String, Object> result = new HashMap<>();
            result.put("pricing", pricing);
            result.put("benefits", benefits);

            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("Failed to retrieve VIP pricing", e);
            return ApiResponse.error("Unable to load pricing: " + e.getMessage());
        }
    }

    private VipOrder createOrder(Long userId, String vipType, Integer durationMonths) {
        VipOrder order = new VipOrder();

        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setVipType(vipType);
        order.setDurationMonths(durationMonths);

        Map<String, Object> priceInfo = calculatePrice(vipType, durationMonths);
        order.setProductName((String) priceInfo.get("productName"));
        order.setOriginalPrice((BigDecimal) priceInfo.get("originalPrice"));
        order.setDiscountAmount((BigDecimal) priceInfo.get("discountAmount"));
        order.setFinalAmount((BigDecimal) priceInfo.get("finalAmount"));

        order.setStatus("PENDING");
        order.setDeleted(false);
        order.setCreatedTime(LocalDateTime.now());

        return order;
    }

    private String generateOrderNo() {
        String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int random = (int) (Math.random() * 10000);
        return "VIP" + timeStr + String.format("%04d", random);
    }

    private Map<String, Object> calculatePrice(String vipType, Integer durationMonths) {
        Map<String, Object> result = new HashMap<>();

        BigDecimal originalPrice;
        BigDecimal finalPrice;
        String productName;

        if ("VIP".equalsIgnoreCase(vipType)) {
            switch (durationMonths) {
                case 1 -> {
                    originalPrice = new BigDecimal("39.90");
                    finalPrice = new BigDecimal("29.90");
                    productName = "VIP Membership (1 month)";
                }
                case 3 -> {
                    originalPrice = new BigDecimal("119.70");
                    finalPrice = new BigDecimal("79.90");
                    productName = "VIP Membership (3 months)";
                }
                case 12 -> {
                    originalPrice = new BigDecimal("478.80");
                    finalPrice = new BigDecimal("298.00");
                    productName = "VIP Membership (12 months)";
                }
                default -> throw new IllegalArgumentException("Unsupported VIP duration");
            }
        } else if ("PREMIUM".equalsIgnoreCase(vipType)) {
            switch (durationMonths) {
                case 1 -> {
                    originalPrice = new BigDecimal("89.90");
                    finalPrice = new BigDecimal("69.90");
                    productName = "Premium Membership (1 month)";
                }
                case 3 -> {
                    originalPrice = new BigDecimal("269.70");
                    finalPrice = new BigDecimal("199.90");
                    productName = "Premium Membership (3 months)";
                }
                case 12 -> {
                    originalPrice = new BigDecimal("1078.80");
                    finalPrice = new BigDecimal("688.00");
                    productName = "Premium Membership (12 months)";
                }
                default -> throw new IllegalArgumentException("Unsupported Premium duration");
            }
        } else {
            throw new IllegalArgumentException("Unknown membership type");
        }

        result.put("productName", productName);
        result.put("originalPrice", originalPrice);
        result.put("discountAmount", originalPrice.subtract(finalPrice));
        result.put("finalAmount", finalPrice);
        return result;
    }

    private String getOrderStatusText(String status) {
        return switch (status) {
            case "PENDING" -> "Pending payment";
            case "PAID" -> "Paid";
            case "CANCELLED" -> "Cancelled";
            case "REFUNDED" -> "Refunded";
            case "EXPIRED" -> "Expired";
            default -> "Unknown";
        };
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader(jwtUtil.getHeader());
            String token = jwtUtil.extractTokenFromHeader(authHeader);
            if (token != null && jwtUtil.validateToken(token)) {
                return jwtUtil.getUserIdFromToken(token);
            }
            return null;
        } catch (Exception e) {
            log.warn("Failed to resolve current user id", e);
            return null;
        }
    }
}


