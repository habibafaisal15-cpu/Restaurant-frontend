function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  name,
  inputMode,
  autoComplete,
}) {
  const inputId = id || name;

  return (
    <label className="input-field" htmlFor={inputId}>
      {label && <span className="input-field__label">{label}</span>}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
      />
    </label>
  );
}

export default Input;
