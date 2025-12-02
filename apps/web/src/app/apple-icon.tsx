import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          position: 'relative',
        }}
      >
        {/* 中心大节点 */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: 70,
            left: 70,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />
        
        {/* 左上节点 */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            position: 'absolute',
            top: 28,
            left: 28,
          }}
        />
        
        {/* 右上节点 */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            position: 'absolute',
            top: 28,
            right: 28,
          }}
        />
        
        {/* 左下节点 */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            position: 'absolute',
            bottom: 28,
            left: 28,
          }}
        />
        
        {/* 右下节点 */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            position: 'absolute',
            bottom: 28,
            right: 28,
          }}
        />
        
        {/* 连接线 - 左上到中心 */}
        <div
          style={{
            width: 45,
            height: 8,
            background: 'rgba(255,255,255,0.6)',
            position: 'absolute',
            top: 62,
            left: 45,
            transform: 'rotate(45deg)',
            borderRadius: 4,
          }}
        />
        
        {/* 连接线 - 右上到中心 */}
        <div
          style={{
            width: 45,
            height: 8,
            background: 'rgba(255,255,255,0.6)',
            position: 'absolute',
            top: 62,
            right: 45,
            transform: 'rotate(-45deg)',
            borderRadius: 4,
          }}
        />
        
        {/* 连接线 - 左下到中心 */}
        <div
          style={{
            width: 45,
            height: 8,
            background: 'rgba(255,255,255,0.6)',
            position: 'absolute',
            bottom: 62,
            left: 45,
            transform: 'rotate(-45deg)',
            borderRadius: 4,
          }}
        />
        
        {/* 连接线 - 右下到中心 */}
        <div
          style={{
            width: 45,
            height: 8,
            background: 'rgba(255,255,255,0.6)',
            position: 'absolute',
            bottom: 62,
            right: 45,
            transform: 'rotate(45deg)',
            borderRadius: 4,
          }}
        />
        
        {/* 水平连接线 - 上 */}
        <div
          style={{
            width: 70,
            height: 4,
            background: 'rgba(255,255,255,0.35)',
            position: 'absolute',
            top: 40,
            left: 55,
            borderRadius: 2,
          }}
        />
        
        {/* 水平连接线 - 下 */}
        <div
          style={{
            width: 70,
            height: 4,
            background: 'rgba(255,255,255,0.35)',
            position: 'absolute',
            bottom: 40,
            left: 55,
            borderRadius: 2,
          }}
        />
        
        {/* 垂直连接线 - 左 */}
        <div
          style={{
            width: 4,
            height: 70,
            background: 'rgba(255,255,255,0.35)',
            position: 'absolute',
            top: 55,
            left: 40,
            borderRadius: 2,
          }}
        />
        
        {/* 垂直连接线 - 右 */}
        <div
          style={{
            width: 4,
            height: 70,
            background: 'rgba(255,255,255,0.35)',
            position: 'absolute',
            top: 55,
            right: 40,
            borderRadius: 2,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
