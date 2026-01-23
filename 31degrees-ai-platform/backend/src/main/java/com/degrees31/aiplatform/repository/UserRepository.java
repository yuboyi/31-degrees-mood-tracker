package com.degrees31.aiplatform.repository;

import com.degrees31.aiplatform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 用户数据访问层
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 根据微信openid查找用户
     * 
     * @param openid 微信openid
     * @return 用户信息
     */
    Optional<User> findByOpenid(String openid);

    /**
     * 根据微信unionid查找用户
     * 
     * @param unionid 微信unionid
     * @return 用户信息
     */
    Optional<User> findByUnionid(String unionid);

    /**
     * 根据手机号查找用户
     * 
     * @param phone 手机号
     * @return 用户信息
     */
    Optional<User> findByPhone(String phone);

    /**
     * 检查openid是否已存在
     * 
     * @param openid 微信openid
     * @return 是否存在
     */
    boolean existsByOpenid(String openid);

    /**
     * 检查手机号是否已存在
     * 
     * @param phone 手机号
     * @return 是否存在
     */
    boolean existsByPhone(String phone);

    /**
     * 查找所有正常状态的用户
     * 
     * @return 用户列表
     */
    @Query("SELECT u FROM User u WHERE u.status = 1 ORDER BY u.createdTime DESC")
    List<User> findAllActiveUsers();

    /**
     * 查找VIP用户
     * 
     * @return VIP用户列表
     */
    @Query("SELECT u FROM User u WHERE u.vipLevel > 0 AND (u.vipExpireTime IS NULL OR u.vipExpireTime > CURRENT_TIMESTAMP) ORDER BY u.vipLevel DESC")
    List<User> findVipUsers();

    /**
     * 根据用户状态统计数量
     * 
     * @param status 用户状态
     * @return 数量
     */
    long countByStatus(Integer status);

    /**
     * 统计今日新增用户数
     * 
     * @param date 日期
     * @return 数量
     */
    @Query("SELECT COUNT(u) FROM User u WHERE DATE(u.createdTime) = :date")
    long countNewUsersByDate(@Param("date") LocalDate date);

    /**
     * 统计指定日期范围内的新增用户数
     * 
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 数量
     */
    @Query("SELECT COUNT(u) FROM User u WHERE DATE(u.createdTime) BETWEEN :startDate AND :endDate")
    long countNewUsersBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 查找需要重置每日请求次数的用户
     * 
     * @param date 日期
     * @return 用户列表
     */
    @Query("SELECT u FROM User u WHERE u.lastRequestDate < :date AND u.dailyRequests > 0")
    List<User> findUsersNeedingDailyReset(@Param("date") LocalDate date);

    /**
     * 查找即将过期的VIP用户
     * 
     * @param days 提前天数
     * @return 用户列表
     */
    @Query("SELECT u FROM User u WHERE u.vipLevel > 0 AND u.vipExpireTime BETWEEN CURRENT_TIMESTAMP AND DATE_ADD(CURRENT_TIMESTAMP, INTERVAL :days DAY)")
    List<User> findVipUsersExpiringInDays(@Param("days") int days);

    /**
     * 按VIP等级分组统计用户数量
     * 
     * @return 统计结果 [vipLevel, count]
     */
    @Query("SELECT u.vipLevel, COUNT(u) FROM User u WHERE u.status = 1 GROUP BY u.vipLevel ORDER BY u.vipLevel")
    List<Object[]> countUsersByVipLevel();

    /**
     * 查找活跃用户（最近30天有请求）
     * 
     * @param days 天数
     * @return 用户列表
     */
    @Query("SELECT u FROM User u WHERE u.lastRequestDate >= DATE_SUB(CURRENT_DATE, INTERVAL :days DAY) ORDER BY u.lastRequestDate DESC")
    List<User> findActiveUsersInRecentDays(@Param("days") int days);

    /**
     * 更新用户最后请求日期和请求次数
     * 
     * @param userId 用户ID
     * @param date 日期
     * @param dailyRequests 每日请求次数
     * @param totalRequests 总请求次数
     */
    @Query("UPDATE User u SET u.lastRequestDate = :date, u.dailyRequests = :dailyRequests, u.totalRequests = :totalRequests WHERE u.id = :userId")
    void updateUserRequestInfo(@Param("userId") Long userId, 
                              @Param("date") LocalDate date,
                              @Param("dailyRequests") Integer dailyRequests,
                              @Param("totalRequests") Integer totalRequests);
}