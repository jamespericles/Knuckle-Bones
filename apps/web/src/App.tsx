import { defaultRng } from '@knucklebones/engine';
import type { Rng } from '@knucklebones/engine';
import type { ReactNode } from 'react';
import { useHashRoute } from './router/useHashRoute';
import type { Route } from './router/useHashRoute';
import { AsyncGameScreen } from './screens/AsyncGameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LocalGameScreen } from './screens/LocalGameScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';

export interface AppProps {
  readonly rng?: Rng | undefined;
  readonly cpuDelayMs?: number | undefined;
}

function renderRoute(route: Route, rng: Rng, cpuDelayMs: number | undefined): ReactNode {
  switch (route.kind) {
    case 'home':
      return <HomeScreen rng={rng} />;
    case 'local':
      if (route.mode === 'cpu') {
        return (
          <LocalGameScreen
            key={`cpu-${route.difficulty}`}
            mode="cpu"
            difficulty={route.difficulty}
            rng={rng}
            cpuDelayMs={cpuDelayMs}
          />
        );
      }
      return (
        <LocalGameScreen
          key="pass"
          mode="pass"
          difficulty="normal"
          rng={rng}
          cpuDelayMs={cpuDelayMs}
        />
      );
    case 'game':
      return <AsyncGameScreen code={route.code} rng={rng} />;
    case 'not-found':
      return <NotFoundScreen hash={route.hash} />;
  }
}

export function App({ rng = defaultRng, cpuDelayMs }: AppProps) {
  const route = useHashRoute();
  return <div className="app">{renderRoute(route, rng, cpuDelayMs)}</div>;
}
