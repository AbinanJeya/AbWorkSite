export default function Slider({
  minimumValue = 0,
  maximumValue = 1,
  value = 0,
  onValueChange,
  style,
}) {
  return (
    <input
      type="range"
      min={minimumValue}
      max={maximumValue}
      value={value}
      step="1"
      onChange={(event) => onValueChange?.(Number(event.target.value))}
      style={{
        width: '100%',
        accentColor: '#25f46a',
        ...style,
      }}
    />
  );
}
