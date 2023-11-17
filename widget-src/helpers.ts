export const OPENAI_API_KEY = "REPLACE_ME";

export let drag = `<style>
#corner {
  position: absolute;
  width: 16px;
  height: 16px;
  right: 0;
  bottom: 0;
  cursor: nwse-resize;
}
</style>
<div id="corner"></div>
<script>
  const corner = document.getElementById('corner');
  function resizeWindow(e) {
    const size = {
      width: Math.max(50,Math.floor(e.clientX+5)),
      height: Math.max(50,Math.floor(e.clientY+5))
    };
    parent.postMessage( { pluginMessage: { type: 'resize', size: size }}, '*');
  }
  corner.onpointerdown = (e)=>{
    corner.onpointermove = resizeWindow;
    corner.setPointerCapture(e.pointerId);
  };
  corner.onpointerup = (e)=>{
    corner.onpointermove = null;
    corner.releasePointerCapture(e.pointerId);
  };
</script>`;
