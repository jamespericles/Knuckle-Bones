import { useState } from 'react';
import { copyLink, shareLink } from '../../lib/share';
import type { ShareOutcome } from '../../lib/share';
import { Button } from '../Button/Button';
import { Sheet } from './Sheet';

export interface ShareMoveSheetProps {
  readonly open: boolean;
  readonly url: string;
  readonly text: string;
  readonly intro: string;
  readonly onClose: () => void;
}

const STATUS: Readonly<Record<ShareOutcome, string | null>> = {
  shared: 'Sent.',
  copied: 'Link copied. Paste it to your friend.',
  manual: 'Copy the link below and send it.',
  cancelled: null,
};

export function ShareMoveSheet({ open, url, text, intro, onClose }: ShareMoveSheetProps) {
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);

  const close = () => {
    setOutcome(null);
    onClose();
  };
  const share = () => {
    void shareLink(url, text).then(setOutcome);
  };
  const copy = () => {
    void copyLink(url).then(setOutcome);
  };

  const status = outcome ? STATUS[outcome] : null;
  const showLink = outcome === 'manual' || outcome === 'copied';

  return (
    <Sheet open={open} title="Send your move" onClose={close}>
      <p>{intro}</p>
      <div className="sheet__actions">
        <Button onClick={share}>Share link</Button>
        <Button variant="secondary" onClick={copy}>
          Copy link
        </Button>
      </div>
      {status ? (
        <p role="status" className="muted">
          {status}
        </p>
      ) : null}
      {showLink ? (
        <input
          className="link-box"
          readOnly
          value={url}
          aria-label="Game link"
          onFocus={event => event.currentTarget.select()}
        />
      ) : null}
      <Button variant="ghost" onClick={close}>
        Done
      </Button>
    </Sheet>
  );
}
