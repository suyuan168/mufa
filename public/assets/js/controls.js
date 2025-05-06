/**
 * Controls Module
 * Handles player movement controls with touch joystick
 */
const Controls = (() => {
  // Joystick elements
  const joystickContainer = document.getElementById('joystick-container');
  const joystickBase = document.getElementById('joystick-base');
  const joystickKnob = document.getElementById('joystick-knob');
  const hookButton = document.getElementById('hook-button');
  
  // Joystick state
  let isDragging = false;
  let centerX = 0;
  let centerY = 0;
  let knobX = 0;
  let knobY = 0;
  let direction = { x: 0, y: 0 };
  let maxDistance = 0;
  
  // Hook state
  let isHooking = false;
  
  // Initialize base position
  const initJoystick = () => {
    const baseRect = joystickBase.getBoundingClientRect();
    centerX = baseRect.width / 2;
    centerY = baseRect.height / 2;
    maxDistance = baseRect.width / 2 - joystickKnob.offsetWidth / 2;
    
    // Reset knob position
    joystickKnob.style.transform = `translate(0px, 0px)`;
  };
  
  // Handle touch start event
  const onTouchStart = (event) => {
    event.preventDefault();
    
    const touch = event.targetTouches[0];
    isDragging = true;
    
    // Recalculate center position (in case of resize or orientation change)
    const baseRect = joystickBase.getBoundingClientRect();
    centerX = baseRect.left + baseRect.width / 2;
    centerY = baseRect.top + baseRect.height / 2;
    
    updateJoystickPosition(touch.clientX, touch.clientY);
  };
  
  // Handle touch move event
  const onTouchMove = (event) => {
    if (!isDragging) return;
    event.preventDefault();
    
    const touch = event.targetTouches[0];
    updateJoystickPosition(touch.clientX, touch.clientY);
  };
  
  // Handle touch end event
  const onTouchEnd = (event) => {
    event.preventDefault();
    isDragging = false;
    
    // Reset knob position
    joystickKnob.style.transform = `translate(0px, 0px)`;
    direction = { x: 0, y: 0 };
  };
  
  // Calculate joystick position and movement direction
  const updateJoystickPosition = (touchX, touchY) => {
    // Calculate distance from center
    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Normalize to get direction
    direction.x = deltaX / (distance || 1);
    direction.y = deltaY / (distance || 1);
    
    // Limit distance to max radius
    const limitedDistance = Math.min(distance, maxDistance);
    
    // Calculate new position with limited distance
    knobX = direction.x * limitedDistance;
    knobY = direction.y * limitedDistance;
    
    // Update knob position
    joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
  };
  
  // Handle hook button press
  const onHookStart = () => {
    isHooking = true;
    Game.startHook();
  };
  
  // Handle hook button release
  const onHookEnd = () => {
    isHooking = false;
    Game.stopHook();
  };
  
  // Get current movement direction
  const getDirection = () => {
    return direction;
  };
  
  // Check if hook is active
  const isHookActive = () => {
    return isHooking;
  };
  
  // Initialize controls module
  const init = () => {
    // Initialize joystick position
    initJoystick();
    
    // Add joystick event listeners
    joystickBase.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', initJoystick);
    
    // Add hook button event listeners
    hookButton.addEventListener('touchstart', onHookStart);
    hookButton.addEventListener('touchend', onHookEnd);
    hookButton.addEventListener('touchcancel', onHookEnd);
    
    // For desktop testing
    if (!('ontouchstart' in window)) {
      joystickBase.addEventListener('mousedown', (e) => {
        isDragging = true;
        const baseRect = joystickBase.getBoundingClientRect();
        centerX = baseRect.left + baseRect.width / 2;
        centerY = baseRect.top + baseRect.height / 2;
        updateJoystickPosition(e.clientX, e.clientY);
      });
      
      document.addEventListener('mousemove', (e) => {
        if (isDragging) {
          updateJoystickPosition(e.clientX, e.clientY);
        }
      });
      
      document.addEventListener('mouseup', () => {
        isDragging = false;
        joystickKnob.style.transform = `translate(0px, 0px)`;
        direction = { x: 0, y: 0 };
      });
      
      hookButton.addEventListener('mousedown', onHookStart);
      hookButton.addEventListener('mouseup', onHookEnd);
    }
    
    // Prevent page scrolling when using the joystick
    document.addEventListener('touchmove', (e) => {
      if (isDragging) {
        e.preventDefault();
      }
    }, { passive: false });
  };
  
  // Public methods
  return {
    init,
    getDirection,
    isHookActive
  };
})(); 