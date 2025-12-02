import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          position: 'relative',
        }}
      >
        {/* 中心大节点 */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'white',
            position: 'absolute',
            top: 12,
            left: 12,
          }}
        />
        
        {/* 左上节点 */}
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            position: 'absolute',
            top: 5,
            left: 5,
          }}
        />
        
        {/* 右上节点 */}
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            position: 'absolute',
            top: 5,
            right: 5,
          }}
        />
        
        {/* 左下节点 */}
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            position: 'absolute',
            bottom: 5,
            left: 5,
          }}
        />
        
        {/* 右下节点 */}
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.9)',
            position: 'absolute',
            bottom: 5,
            right: 5,
          }}
        />
        
        {/* 连接线 - 左上到中心 */}
        <div
          style={{
            width: 8,
            height: 2,
            background: 'rgba(255,255,255,0.6)',
            position: 'absolute',
            top: 10,
            left: 8,
            transform: 'rotate(45deg)',
          }}
        />
        
        {/* 连接线 - 右上到中心 */}
        <div
          style={{
            width: 8,
            height: 2,
            background: 'rgba(255,255,255,0.6)',
            position: 'absolute',
            top: 10,
            right: 8,
            transform: 'rotate(-45deg)',
          }}
        />
        
        {/* 连接线 - 左下到中心 */}
        <div
          style={{
            width: 8,
            height: 2,
            background: 'rgba(255,255,255,0.6)',
            position: 'absolute',
            bottom: 10,
            left: 8,
            transform: 'rotate(-45deg)',
          }}
        />
        
        {/* 连接线 - 右下到中心 */}
        <div
          style={{
            width: 8,
            height: 2,
            background: 'rgba(255,255,255,0.6)',
            position: 'absolute',
            bottom: 10,
            right: 8,
            transform: 'rotate(45deg)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
