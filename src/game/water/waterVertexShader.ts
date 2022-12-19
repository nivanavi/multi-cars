export const waterVertexShader = `
    uniform float uTime;
    uniform float elevationLevel;
       
    varying float vElevation;
    
    float rand(vec2 co){
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }
   
    
    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      float elevation = sin(rand(vec2(modelPosition.z, modelPosition.x)) * uTime) * elevationLevel;
            
      modelPosition.y += elevation;
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectionPosition = projectionMatrix * viewPosition;
      
      gl_Position = projectionPosition; 
      
      vElevation = elevation;
    }
`;
