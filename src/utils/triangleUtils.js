
// triangleUtils.js

import { calculateDistance, calculateAngle } from './geoUtils';

export const calculateTriangleArea = (A, B, C) => {
  const ab = calculateDistance(A.lat, A.lng, B.lat, B.lng);
  const bc = calculateDistance(B.lat, B.lng, C.lat, C.lng);
  const ca = calculateDistance(C.lat, C.lng, A.lat, A.lng);
  const s = (ab + bc + ca) / 2;
  const area2 = s * (s - ab) * (s - bc) * (s - ca);
  return area2 > 0 ? Math.sqrt(area2) : 0;
};

export const getTriangleType = (A, B, C) => {
  const ab = calculateDistance(A.lat, A.lng, B.lat, B.lng);
  const bc = calculateDistance(B.lat, B.lng, C.lat, C.lng);
  const ca = calculateDistance(C.lat, C.lng, A.lat, A.lng);
  const sides = [ab, bc, ca].sort((a, b) => a - b);
  if (Math.abs(sides[0] - sides[1]) < 0.01 && Math.abs(sides[1] - sides[2]) < 0.01) return "Equilateral";
  if (Math.abs(sides[0] - sides[1]) < 0.01 || Math.abs(sides[1] - sides[2]) < 0.01) return "Isosceles";
  const angleB = calculateAngle(A, B, C);
  if (Math.abs(angleB - 90) < 1) return "Right";
  return "Scalene";
};

export const midpoint = (A, B) => ({ lat: (A.lat + B.lat) / 2, lng: (A.lng + B.lng) / 2 });



export const calculateStrengthOfFigure = (A, B, C) => {
  const degToRad = Math.PI / 180;

  const cot = (x) => 1 / Math.tan(x);

  const a = cot((A / 2) * degToRad);
  const b = cot((B / 2) * degToRad);
  const c = cot((C / 2) * degToRad);

  return (1 / 3) * (a * a + b * b + c * c);
};