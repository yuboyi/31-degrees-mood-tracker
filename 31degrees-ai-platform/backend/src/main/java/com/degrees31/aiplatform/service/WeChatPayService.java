package com.degrees31.aiplatform.service;

import com.degrees31.aiplatform.entity.VipOrder;
import com.degrees31.aiplatform.repository.VipOrderRepository;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.core.RSAAutoCertificateConfig;
import com.wechat.pay.java.service.payments.jsapi.JsapiServiceExtension;
import com.wechat.pay.java.service.payments.jsapi.model.Amount;
import com.wechat.pay.java.service.payments.jsapi.model.Payer;
import com.wechat.pay.java.service.payments.jsapi.model.PrepayRequest;
import com.wechat.pay.java.service.payments.jsapi.model.PrepayWithRequestPaymentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service that coordinates WeChat JSAPI payments for membership orders.
 */
@Slf4j
@Service
public class WeChatPayService {

    @Value("${wechat.pay.app-id}")
    private String appId;

    @Value("${wechat.pay.mch-id}")
    private String mchId;

    @Value("${wechat.pay.private-key-path}")
    private String privateKeyPath;

    @Value("${wechat.pay.merchant-serial-number}")
    private String merchantSerialNumber;

    @Value("${wechat.pay.api-v3-key}")
    private String apiV3Key;

    @Value("${wechat.pay.notify-url}")
    private String notifyUrl;

    private final VipOrderRepository vipOrderRepository;

    public WeChatPayService(VipOrderRepository vipOrderRepository) {
        this.vipOrderRepository = vipOrderRepository;
    }

    /**
     * Create a JSAPI prepay order for the given membership purchase.
     */
    @Transactional
    public PrepayWithRequestPaymentResponse createPayOrder(VipOrder order, String openId) {
        try {
            Config config = new RSAAutoCertificateConfig.Builder()
                    .merchantId(mchId)
                    .privateKeyFromPath(privateKeyPath)
                    .merchantSerialNumber(merchantSerialNumber)
                    .apiV3Key(apiV3Key)
                    .build();

            JsapiServiceExtension service = new JsapiServiceExtension.Builder()
                    .config(config)
                    .build();

            PrepayRequest request = new PrepayRequest();
            request.setAppid(appId);
            request.setMchid(mchId);
            request.setDescription(order.getProductName());
            request.setOutTradeNo(order.getOrderNo());
            request.setNotifyUrl(notifyUrl);

            Amount amount = new Amount();
            amount.setTotal(order.getFinalAmount().multiply(new BigDecimal("100")).intValue());
            amount.setCurrency("CNY");
            request.setAmount(amount);

            Payer payer = new Payer();
            payer.setOpenid(openId);
            request.setPayer(payer);

            String timeExpire = LocalDateTime.now().plusMinutes(30)
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
            request.setTimeExpire(timeExpire);

            PrepayWithRequestPaymentResponse response = service.prepayWithRequestPayment(request);

            order.setWxOutTradeNo(order.getOrderNo());
            order.setPayMethod("WECHAT");
            vipOrderRepository.save(order);

            log.info("WeChat prepay order created, orderNo={}, total={}", order.getOrderNo(), order.getFinalAmount());
            return response;
        } catch (Exception e) {
            log.error("Failed to create WeChat prepay order, orderNo={}", order.getOrderNo(), e);
            throw new RuntimeException("Failed to create payment order: " + e.getMessage());
        }
    }

    /**
     * Persist payment success/failure information from the asynchronous notification.
     */
    @Transactional
    public void handlePaymentNotification(String transactionId, String outTradeNo, String tradeState) {
        try {
            log.info("Handling WeChat payment callback, transactionId={}, orderNo={}, state={}",
                    transactionId, outTradeNo, tradeState);

            VipOrder order = vipOrderRepository.findByOrderNo(outTradeNo);
            if (order == null) {
                log.error("Payment callback ignored because order does not exist: {}", outTradeNo);
                return;
            }

            if ("SUCCESS".equals(tradeState)) {
                order.setStatus("PAID");
                order.setWxTransactionId(transactionId);
                order.setPayTime(LocalDateTime.now());

                LocalDateTime now = LocalDateTime.now();
                order.setValidFrom(now);
                order.setValidTo(now.plusMonths(order.getDurationMonths()));

                vipOrderRepository.save(order);
                updateUserVipStatus(order);
                log.info("Order marked as PAID via WeChat callback, orderNo={}", outTradeNo);
            } else {
                log.warn("Payment callback reported non-success state, orderNo={}, state={}", outTradeNo, tradeState);
            }
        } catch (Exception e) {
            log.error("Failed to process WeChat payment callback for orderNo={}", outTradeNo, e);
        }
    }

    /**
     * Query the current order status. For now we rely on the local database record.
     */
    public String queryOrderStatus(String orderNo) {
        try {
            VipOrder order = vipOrderRepository.findByOrderNo(orderNo);
            return order != null ? order.getStatus() : "NOT_FOUND";
        } catch (Exception e) {
            log.error("Failed to query order state, orderNo={}", orderNo, e);
            return "ERROR";
        }
    }

    /**
     * Issue a refund request. (Placeholder – refund API wiring still required.)
     */
    @Transactional
    public boolean refundOrder(String orderNo, BigDecimal refundAmount, String reason) {
        try {
            VipOrder order = vipOrderRepository.findByOrderNo(orderNo);
            if (order == null || !"PAID".equals(order.getStatus())) {
                log.error("Cannot refund. Order either missing or not PAID. orderNo={}", orderNo);
                return false;
            }

            order.setStatus("REFUNDED");
            order.setRefundTime(LocalDateTime.now());
            order.setRefundAmount(refundAmount);
            order.setRefundReason(reason);
            vipOrderRepository.save(order);

            rollbackUserVipStatus(order);
            log.info("Order refunded successfully, orderNo={}, amount={}", orderNo, refundAmount);
            return true;
        } catch (Exception e) {
            log.error("Failed to refund order, orderNo={}", orderNo, e);
            return false;
        }
    }

    private void updateUserVipStatus(VipOrder order) {
        log.info("TODO: propagate VIP upgrade to user service. userId={}", order.getUserId());
    }

    private void rollbackUserVipStatus(VipOrder order) {
        log.info("TODO: rollback VIP entitlement after refund. userId={}", order.getUserId());
    }
}