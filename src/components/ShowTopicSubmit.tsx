import { useState, type FormEvent } from 'react';
import { submitShowTopic } from '../services/api';

type Status = 'idle' | 'sending' | 'ok' | 'error' | 'config';

export function ShowTopicSubmit() {
  const [topic, setTopic] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanTopic = topic.trim();
    if (!cleanTopic || status === 'sending') return;

    setStatus('sending');
    try {
      const result = await submitShowTopic({
        topic: cleanTopic,
        reason: reason.trim(),
      });
      if (result === 'config') {
        setStatus('config');
        return;
      }
      if (result !== 'ok') throw new Error('submit failed');
      setTopic('');
      setReason('');
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="show-topic-submit" className="show-topic" aria-labelledby="show-topic-title">
      <div className="show-topic__intro">
        <p className="section-eyebrow">Next show</p>
        <h2 id="show-topic-title">Submit your topic for the next show</h2>
        <p>
          Drop a topic and a short note on why it matters. We review submissions for the next
          ONCHAIN CA$H broadcast.
        </p>
      </div>

      <form className="show-topic__form" onSubmit={onSubmit}>
        <label className="show-topic__field">
          <span>Topic</span>
          <input
            type="text"
            name="topic"
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              if (status !== 'idle' && status !== 'sending') setStatus('idle');
            }}
            maxLength={200}
            required
            placeholder="What should we cover?"
            autoComplete="off"
          />
        </label>

        <label className="show-topic__field">
          <span>Why we should talk about it</span>
          <textarea
            name="reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (status !== 'idle' && status !== 'sending') setStatus('idle');
            }}
            maxLength={800}
            rows={4}
            placeholder="Keep it short, context helps."
          />
        </label>

        <div className="show-topic__actions">
          <button type="submit" className="btn btn-primary" disabled={status === 'sending' || !topic.trim()}>
            {status === 'sending' ? 'Sending…' : 'Submit topic'}
          </button>
          {status === 'ok' && (
            <p className="show-topic__status show-topic__status--ok" role="status">
              Got it, thanks. We’ll review it for the next show.
            </p>
          )}
          {status === 'error' && (
            <p className="show-topic__status show-topic__status--error" role="alert">
              Couldn’t send right now. Try again in a moment.
            </p>
          )}
          {status === 'config' && (
            <p className="show-topic__status show-topic__status--error" role="alert">
              Submissions aren’t connected yet. Check back soon.
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
