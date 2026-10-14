import { MAX_NAME_LENGTH } from '@knucklebones/engine';
import './NameField.css';

export interface NameFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly autoFocus?: boolean | undefined;
}

export function NameField(props: NameFieldProps) {
  const { value, onChange, label = 'Your name', placeholder = 'Lamb', autoFocus } = props;
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className="field__input"
        type="text"
        value={value}
        maxLength={MAX_NAME_LENGTH}
        placeholder={placeholder}
        autoComplete="nickname"
        autoCapitalize="words"
        autoFocus={autoFocus}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  );
}
