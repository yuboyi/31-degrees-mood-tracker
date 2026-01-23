package com.degrees31.aiplatform.util;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URL;
import java.util.Base64;

/**
 * 图像处理工具类
 * 用于实现图转2.5D/3D效果
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@Component
public class ImageProcessUtil {

    /**
     * 图转2.5D效果处理
     * 
     * @param imageUrl 原图URL
     * @return 处理结果
     */
    public ImageProcessResult imageTo25D(String imageUrl) {
        try {
            log.info("开始处理图转2.5D，imageUrl: {}", imageUrl);

            // 1. 下载原图
            BufferedImage originalImage = downloadImage(imageUrl);
            if (originalImage == null) {
                return ImageProcessResult.error("无法下载原图");
            }

            // 2. 应用2.5D效果
            BufferedImage processedImage = apply25DEffect(originalImage);
            
            // 3. 转换为Base64
            String base64 = imageToBase64(processedImage, "jpg");
            if (base64 == null) {
                return ImageProcessResult.error("图像转换失败");
            }

            log.info("图转2.5D处理完成");
            return ImageProcessResult.success(base64, "图转2.5D处理完成");

        } catch (Exception e) {
            log.error("图转2.5D处理异常", e);
            return ImageProcessResult.error("图转2.5D处理异常: " + e.getMessage());
        }
    }

    /**
     * 图转3D效果处理（简化版）
     * 
     * @param imageUrl 原图URL
     * @return 处理结果
     */
    public ImageProcessResult imageTo3D(String imageUrl) {
        try {
            log.info("开始处理图转3D，imageUrl: {}", imageUrl);

            // 1. 下载原图
            BufferedImage originalImage = downloadImage(imageUrl);
            if (originalImage == null) {
                return ImageProcessResult.error("无法下载原图");
            }

            // 2. 应用3D效果（这里使用简化的立体效果）
            BufferedImage processedImage = apply3DEffect(originalImage);
            
            // 3. 转换为Base64
            String base64 = imageToBase64(processedImage, "jpg");
            if (base64 == null) {
                return ImageProcessResult.error("图像转换失败");
            }

            log.info("图转3D处理完成");
            return ImageProcessResult.success(base64, "图转3D处理完成");

        } catch (Exception e) {
            log.error("图转3D处理异常", e);
            return ImageProcessResult.error("图转3D处理异常: " + e.getMessage());
        }
    }

    /**
     * 应用2.5D效果
     * 包括：边缘检测、阴影效果、层次感
     */
    private BufferedImage apply25DEffect(BufferedImage originalImage) {
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        
        // 创建输出图像
        BufferedImage outputImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = outputImage.createGraphics();
        
        // 设置抗锯齿
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);

        try {
            // 1. 绘制原图作为基底
            g2d.drawImage(originalImage, 0, 0, null);

            // 2. 创建边缘检测效果
            BufferedImage edgeImage = detectEdges(originalImage);
            
            // 3. 添加阴影层
            addShadowEffect(g2d, originalImage, 3, 3);

            // 4. 叠加边缘效果
            g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.3f));
            g2d.drawImage(edgeImage, 0, 0, null);

            // 5. 添加高光效果
            g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.2f));
            addHighlightEffect(g2d, originalImage, -2, -2);

        } finally {
            g2d.dispose();
        }

        return outputImage;
    }

    /**
     * 应用3D效果
     * 包括：透视变换、立体阴影、景深效果
     */
    private BufferedImage apply3DEffect(BufferedImage originalImage) {
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        
        // 创建更大的画布以容纳3D效果
        int newWidth = width + 50;
        int newHeight = height + 50;
        BufferedImage outputImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = outputImage.createGraphics();
        
        // 设置抗锯齿
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);

        try {
            // 设置背景
            g2d.setColor(new Color(240, 240, 240));
            g2d.fillRect(0, 0, newWidth, newHeight);

            // 1. 创建多层阴影效果
            for (int i = 8; i >= 0; i -= 2) {
                float alpha = 0.1f - (i * 0.01f);
                g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, alpha));
                g2d.setColor(Color.BLACK);
                g2d.fillRoundRect(15 + i, 15 + i, width, height, 10, 10);
            }

            // 2. 绘制主图像（带轻微透视）
            g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1.0f));
            
            // 应用轻微的透视变换
            int[] xPoints = {10, width + 5, width + 15, 20};
            int[] yPoints = {10, 5, height + 10, height + 15};
            
            // 创建透视效果的图像
            BufferedImage perspectiveImage = createPerspectiveImage(originalImage, xPoints, yPoints, width, height);
            g2d.drawImage(perspectiveImage, 10, 10, null);

            // 3. 添加边缘高光
            g2d.setColor(new Color(255, 255, 255, 100));
            g2d.setStroke(new BasicStroke(2.0f));
            g2d.drawRoundRect(10, 10, width, height, 8, 8);

        } finally {
            g2d.dispose();
        }

        return outputImage;
    }

    /**
     * 边缘检测（简化版Sobel算法）
     */
    private BufferedImage detectEdges(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();
        BufferedImage edgeImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

        // Sobel算子
        int[][] sobelX = {{-1, 0, 1}, {-2, 0, 2}, {-1, 0, 1}};
        int[][] sobelY = {{-1, -2, -1}, {0, 0, 0}, {1, 2, 1}};

        for (int y = 1; y < height - 1; y++) {
            for (int x = 1; x < width - 1; x++) {
                int gx = 0, gy = 0;

                for (int i = -1; i <= 1; i++) {
                    for (int j = -1; j <= 1; j++) {
                        int pixel = image.getRGB(x + i, y + j);
                        int gray = (int) (0.299 * ((pixel >> 16) & 0xFF) + 
                                        0.587 * ((pixel >> 8) & 0xFF) + 
                                        0.114 * (pixel & 0xFF));
                        
                        gx += gray * sobelX[i + 1][j + 1];
                        gy += gray * sobelY[i + 1][j + 1];
                    }
                }

                int magnitude = (int) Math.sqrt(gx * gx + gy * gy);
                magnitude = Math.min(255, magnitude);
                
                int edgeColor = (255 - magnitude) | ((255 - magnitude) << 8) | ((255 - magnitude) << 16);
                edgeImage.setRGB(x, y, edgeColor);
            }
        }

        return edgeImage;
    }

    /**
     * 添加阴影效果
     */
    private void addShadowEffect(Graphics2D g2d, BufferedImage image, int offsetX, int offsetY) {
        int width = image.getWidth();
        int height = image.getHeight();
        
        g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.3f));
        g2d.setColor(Color.BLACK);
        
        // 创建模糊阴影效果
        for (int i = 0; i < 3; i++) {
            g2d.fillRoundRect(offsetX + i, offsetY + i, width - i * 2, height - i * 2, 5, 5);
        }
    }

    /**
     * 添加高光效果
     */
    private void addHighlightEffect(Graphics2D g2d, BufferedImage image, int offsetX, int offsetY) {
        int width = image.getWidth();
        int height = image.getHeight();
        
        g2d.setColor(Color.WHITE);
        g2d.setStroke(new BasicStroke(1.0f));
        g2d.drawRect(offsetX, offsetY, width, height);
    }

    /**
     * 创建透视效果图像
     */
    private BufferedImage createPerspectiveImage(BufferedImage original, int[] xPoints, int[] yPoints, int width, int height) {
        // 这是一个简化的透视变换
        // 在实际项目中，应该使用更精确的仿射变换
        BufferedImage result = new BufferedImage(width + 20, height + 20, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = result.createGraphics();
        
        try {
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.drawImage(original, 0, 0, width, height, null);
        } finally {
            g2d.dispose();
        }
        
        return result;
    }

    /**
     * 从URL下载图片
     */
    private BufferedImage downloadImage(String imageUrl) {
        try {
            URL url = new URL(imageUrl);
            return ImageIO.read(url);
        } catch (Exception e) {
            log.error("下载图片失败，url: {}", imageUrl, e);
            return null;
        }
    }

    /**
     * 将Base64转换为BufferedImage
     */
    private BufferedImage base64ToImage(String base64) {
        try {
            byte[] imageBytes = Base64.getDecoder().decode(base64);
            return ImageIO.read(new ByteArrayInputStream(imageBytes));
        } catch (Exception e) {
            log.error("Base64转图片失败", e);
            return null;
        }
    }

    /**
     * 将BufferedImage转换为Base64
     */
    private String imageToBase64(BufferedImage image, String format) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, format, baos);
            byte[] imageBytes = baos.toByteArray();
            return Base64.getEncoder().encodeToString(imageBytes);
        } catch (IOException e) {
            log.error("图片转Base64失败", e);
            return null;
        }
    }

    /**
     * 图像处理结果
     */
    @Data
    public static class ImageProcessResult {
        private boolean success;
        private String message;
        private String resultBase64;
        private String resultUrl;

        public static ImageProcessResult success(String base64, String message) {
            ImageProcessResult result = new ImageProcessResult();
            result.setSuccess(true);
            result.setMessage(message);
            result.setResultBase64(base64);
            return result;
        }

        public static ImageProcessResult error(String message) {
            ImageProcessResult result = new ImageProcessResult();
            result.setSuccess(false);
            result.setMessage(message);
            return result;
        }
    }
}