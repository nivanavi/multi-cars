export const waterFragmentsShader = `
  uniform vec3 upperColor;
  uniform vec3 depthColor;
  
  varying float vElevation;
  void main() {
    vec3 color = mix(depthColor, upperColor, vElevation * 2.0);
  
    gl_FragColor = vec4(color, 1.0);
  }
`;
