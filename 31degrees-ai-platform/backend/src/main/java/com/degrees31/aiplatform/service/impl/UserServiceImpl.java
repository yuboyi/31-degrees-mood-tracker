package com.degrees31.aiplatform.service.impl;

import com.degrees31.aiplatform.dto.LoginResponse;
import com.degrees31.aiplatform.dto.WechatLoginRequest;
import com.degrees31.aiplatform.entity.User;
import com.degrees31.aiplatform.repository.UserRepository;
import com.degrees31.aiplatform.service.UserService;
import com.degrees31.aiplatform.util.JwtUtil;
import com.degrees31.aiplatform.util.WechatApiUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 用户服务实现类
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final WechatApiUtil wechatApiUtil;
    private final JwtUtil jwtUtil;

    @Value("${app.business.max-daily-requests:100}")
    private int maxDailyRequests;

    @Value("${app.business.vip-daily-request-limit:500}")
    private int vipDailyRequestLimit;

    @Override
    @Transactional
    public LoginResponse wechatLogin(WechatLoginRequest request) {
        log.info("开始微信小程序登录，code: {}", request.getCode());

        // 1. 调用微信API获取openid和session_key
        WechatApiUtil.WechatSessionInfo sessionInfo = wechatApiUtil.getSessionInfo(request.getCode());
        if (!sessionInfo.isSuccess()) {
            log.error("微信登录失败: {}", sessionInfo.getErrorDescription());
            throw new RuntimeException("微信登录失败: " + sessionInfo.getErrorDescription());
        }

        // 2. 查找或创建用户
        User user = getUserByOpenid(sessionInfo.getOpenid());
        boolean isNewUser = false;
        
        if (user == null) {
            log.info("创建新用户，openid: {}", sessionInfo.getOpenid());
            user = createUser(sessionInfo.getOpenid(), sessionInfo.getUnionid(), request.getUserInfo());
            isNewUser = true;
        } else {
            // 更新现有用户信息
            if (request.getUserInfo() != null) {
                user = updateUserInfo(user, request.getUserInfo());
            }
        }

        // 3. 生成JWT令牌
        String token = jwtUtil.generateToken(user.getId(), user.getOpenid());
        
        // 4. 构建响应
        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .userId(user.getId())
                .nickname(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .vipLevel(user.getVipLevel())
                .vipExpireTime(user.getVipExpireTime())
                .dailyRequestsLeft(getUserRemainingRequests(user.getId()))
                .totalRequests(user.getTotalRequests())
                .build();

        log.info("用户登录成功，userId: {}, isNewUser: {}", user.getId(), isNewUser);
        return LoginResponse.success(token, jwtUtil.getExpiration(), userInfo, isNewUser);
    }

    @Override
    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    @Override
    public User getUserByOpenid(String openid) {
        return userRepository.findByOpenid(openid).orElse(null);
    }

    @Override
    @Transactional
    public User createUser(String openid, String unionid, WechatLoginRequest.WechatUserInfo userInfo) {
        User user = new User();
        user.setOpenid(openid);
        user.setUnionid(unionid);
        user.setStatus(1); // 正常状态
        user.setVipLevel(0); // 普通用户
        user.setTotalRequests(0);
        user.setDailyRequests(0);
        user.setLastRequestDate(LocalDate.now());

        // 设置用户信息
        if (userInfo != null) {
            user.setNickname(userInfo.getNickName());
            user.setAvatarUrl(userInfo.getAvatarUrl());
            user.setGender(userInfo.getGender());
            user.setCity(userInfo.getCity());
            user.setProvince(userInfo.getProvince());
            user.setCountry(userInfo.getCountry());
            user.setLanguage(userInfo.getLanguage());
        }

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User updateUserInfo(User user, WechatLoginRequest.WechatUserInfo userInfo) {
        if (userInfo != null) {
            if (userInfo.getNickName() != null) {
                user.setNickname(userInfo.getNickName());
            }
            if (userInfo.getAvatarUrl() != null) {
                user.setAvatarUrl(userInfo.getAvatarUrl());
            }
            if (userInfo.getGender() != null) {
                user.setGender(userInfo.getGender());
            }
            if (userInfo.getCity() != null) {
                user.setCity(userInfo.getCity());
            }
            if (userInfo.getProvince() != null) {
                user.setProvince(userInfo.getProvince());
            }
            if (userInfo.getCountry() != null) {
                user.setCountry(userInfo.getCountry());
            }
            if (userInfo.getLanguage() != null) {
                user.setLanguage(userInfo.getLanguage());
            }
            
            return userRepository.save(user);
        }
        return user;
    }

    @Override
    @Transactional
    public User incrementUserRequests(Long userId) {
        User user = getUserById(userId);
        if (user != null) {
            user.incrementRequests();
            return userRepository.save(user);
        }
        return null;
    }

    @Override
    public boolean checkDailyRequestLimit(Long userId) {
        User user = getUserById(userId);
        if (user == null || !user.isActive()) {
            return false;
        }

        // 检查日期，如果是新的一天，重置每日请求次数
        LocalDate today = LocalDate.now();
        if (!today.equals(user.getLastRequestDate())) {
            user.setDailyRequests(0);
            user.setLastRequestDate(today);
            userRepository.save(user);
        }

        // 检查请求限制
        int limit = user.isVip() ? vipDailyRequestLimit : maxDailyRequests;
        return user.getDailyRequests() < limit;
    }

    @Override
    public int getUserRemainingRequests(Long userId) {
        User user = getUserById(userId);
        if (user == null) {
            return 0;
        }

        // 检查日期，如果是新的一天，返回最大限制
        LocalDate today = LocalDate.now();
        int currentRequests = today.equals(user.getLastRequestDate()) ? user.getDailyRequests() : 0;
        
        int limit = user.isVip() ? vipDailyRequestLimit : maxDailyRequests;
        return Math.max(0, limit - currentRequests);
    }

    @Override
    @Transactional
    public User upgradeUserVip(Long userId, Integer vipLevel, Integer days) {
        User user = getUserById(userId);
        if (user != null) {
            user.setVipLevel(vipLevel);
            
            // 计算VIP过期时间
            LocalDateTime expireTime = LocalDateTime.now().plusDays(days);
            
            // 如果用户当前还是VIP且未过期，则在现有过期时间基础上延长
            if (user.getVipExpireTime() != null && user.getVipExpireTime().isAfter(LocalDateTime.now())) {
                expireTime = user.getVipExpireTime().plusDays(days);
            }
            
            user.setVipExpireTime(expireTime);
            
            log.info("用户VIP升级成功，userId: {}, vipLevel: {}, expireTime: {}", userId, vipLevel, expireTime);
            return userRepository.save(user);
        }
        return null;
    }

    @Override
    @Transactional
    public void disableUser(Long userId) {
        User user = getUserById(userId);
        if (user != null) {
            user.setStatus(0);
            userRepository.save(user);
            log.info("用户已禁用，userId: {}", userId);
        }
    }

    @Override
    @Transactional
    public void enableUser(Long userId) {
        User user = getUserById(userId);
        if (user != null) {
            user.setStatus(1);
            userRepository.save(user);
            log.info("用户已启用，userId: {}", userId);
        }
    }

    @Override
    @Transactional
    public void resetAllUsersDailyRequests() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<User> users = userRepository.findUsersNeedingDailyReset(yesterday);
        
        for (User user : users) {
            user.setDailyRequests(0);
            userRepository.save(user);
        }
        
        log.info("已重置 {} 个用户的每日请求次数", users.size());
    }
}