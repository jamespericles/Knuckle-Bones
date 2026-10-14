import { Button } from '../components/Button/Button';
import { homeHref } from '../router/routes';
import './Game.css';

export interface NotFoundScreenProps {
  readonly hash: string;
}

export function NotFoundScreen({ hash }: NotFoundScreenProps) {
  return (
    <div className="notice">
      <h1>Nothing here</h1>
      <p className="muted">There is no page at {hash}.</p>
      <Button href={homeHref()}>Home</Button>
    </div>
  );
}
