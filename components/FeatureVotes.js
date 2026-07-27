'use client';
import { useEffect, useState } from 'react';

export default function FeatureVotes({ profileId }) {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [profileId]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/feature-votes' + (profileId ? `?profileId=${profileId}` : ''));
      const data = await res.json();
      setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }

  async function vote(idea) {
    if (!profileId || pending) return;
    setPending(idea.id);
    const wasVoted = idea.voted_by_me;
    setIdeas((prev) => prev
      .map((i) => (i.id === idea.id ? { ...i, voted_by_me: !wasVoted, vote_count: i.vote_count + (wasVoted ? -1 : 1) } : i))
      .sort((a, b) => b.vote_count - a.vote_count));
    try {
      await fetch('/api/feature-votes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profileId, featureId: idea.id }),
      });
    } catch (e) {
      setIdeas((prev) => prev
        .map((i) => (i.id === idea.id ? { ...i, voted_by_me: wasVoted, vote_count: i.vote_count + (wasVoted ? 1 : -1) } : i))
        .sort((a, b) => b.vote_count - a.vote_count));
    } finally {
      setPending(null);
    }
  }

  if (loading) return <p className="card-sub">Laedt Ideen...</p>;
  if (ideas.length === 0) return null;

  return (
    <div className="vote-list">
      {ideas.map((idea) => (
        <div key={idea.id} className="vote-row">
          <div className="vote-row-body">
            <p className="vote-row-title">{idea.title}</p>
            {idea.description && <p className="vote-row-desc">{idea.description}</p>}
          </div>
          <button
            type="button"
            className={'vote-btn' + (idea.voted_by_me ? ' voted' : '')}
            onClick={() => vote(idea)}
            disabled={!profileId || pending === idea.id}
            aria-label={idea.voted_by_me ? 'Stimme zurueckziehen' : 'Dafuer stimmen'}
          >
            <span className="vote-btn-arrow">▲</span>
            <span className="vote-btn-count">{idea.vote_count}</span>
          </button>
        </div>
      ))}
      {!profileId && <p className="card-sub" style={{ marginTop: 10 }}>Lege ein Profil an, um mitzustimmen.</p>}
    </div>
  );
}
