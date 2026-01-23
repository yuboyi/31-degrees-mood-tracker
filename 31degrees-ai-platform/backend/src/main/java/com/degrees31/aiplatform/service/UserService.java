package com.degrees31.aiplatform.service;

import com.degrees31.aiplatform.dto.LoginResponse;
import com.degrees31.aiplatform.dto.WechatLoginRequest;
import com.degrees31.aiplatform.entity.User;

/**
 * 用户服务接口
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
public interface UserService {

    /**
     * 微信小程序登录
     * 
     * @param request 登录请求
     * @return 登录响应
     */
    LoginResponse wechatLogin(WechatLoginRequest request);

    /**
     * 根据ID获取用户信息
     * 
     * @param userId 用户ID
     * @return 用户信息
     */
    User getUserById(Long userId);

    /**
     * 根据openid获取用户信息
     * 
     * @param openid 微信openid
     * @return 用户信息
     */
    User getUserByOpenid(String openid);

    /**
     * 创建新用户
     * 
     * @param openid 微信openid
     * @param unionid 微信unionid（可选）
     * @param userInfo 用户信息（可选）
     * @return 用户信息
     */
    User createUser(String openid, String unionid, WechatLoginRequest.WechatUserInfo userInfo);

    /**
     * 更新用户信息
     * 
     * @param user 用户实体
     * @param userInfo 用户信息
     * @return 更新后的用户信息
     */
    User updateUserInfo(User user, WechatLoginRequest.WechatUserInfo userInfo);

    /**
     * 增加用户请求次数
     * 
     * @param userId 用户ID
     * @return 更新后的用户信息
     */
    User incrementUserRequests(Long userId);

    /**
     * 检查用户每日请求限制
     * 
     * @param userId 用户ID
     * @return 是否允许请求
     */
    boolean checkDailyRequestLimit(Long userId);

    /**
     * 获取用户剩余请求次数
     * 
     * @param userId 用户ID
     * @return 剩余次数
     */
    int getUserRemainingRequests(Long userId);

    /**
     * 升级用户VIP
     * 
     * @param userId 用户ID
     * @param vipLevel VIP等级
     * @param days VIP天数
     * @return 更新后的用户信息
     */
    User upgradeUserVip(Long userId, Integer vipLevel, Integer days);

    /**
     * 禁用用户
     * 
     * @param userId 用户ID
     */
    void disableUser(Long userId);

    /**
     * 启用用户
     * 
     * @param userId 用户ID
     */
    void enableUser(Long userId);

    /**
     * 重置所有用户每日请求次数
     */
    void resetAllUsersDailyRequests();
}