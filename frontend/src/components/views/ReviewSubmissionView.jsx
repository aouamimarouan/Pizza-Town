import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle, AlertTriangle, Star } from 'lucide-react';

const ReviewSubmissionView = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage('Veuillez sélectionner une note.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      await api.post('/reviews', {
        order_id: orderId,
        rating,
        comment
      });
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.error || "Une erreur est survenue lors de l'envoi de votre avis.");
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold font-heading text-ink mb-2">Merci pour votre retour !</h2>
        <p className="text-slate mb-6">Votre avis a bien été enregistré. Nous espérons vous revoir très vite.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-ink text-paper px-6 py-2 rounded font-medium hover:bg-opacity-90 transition"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-mist p-6 md:p-8">
        <h1 className="text-2xl font-bold font-heading text-ink mb-2">Évaluer votre commande</h1>
        <p className="text-slate mb-6">Numéro de commande : <span className="font-mono text-sm">{orderId.split('-')[0].toUpperCase()}</span></p>

        {errorMessage && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 text-red-700 rounded-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink mb-3">
              Note globale <span className="text-signal-red">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className="w-10 h-10 transition-colors"
                    fill={(hoverRating || rating) >= star ? '#FFC107' : 'transparent'}
                    color={(hoverRating || rating) >= star ? '#FFC107' : '#D1D5DB'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-ink mb-2">
              Votre commentaire (optionnel)
            </label>
            <textarea
              className="w-full p-3 border border-mist rounded-lg focus:ring-2 focus:ring-ink focus:border-transparent outline-none transition resize-y min-h-[120px]"
              placeholder="Qu'avez-vous pensé de vos pizzas ?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={status === 'loading'}
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-signal-red text-white font-medium py-3 rounded-lg hover:bg-opacity-90 transition disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {status === 'loading' ? 'Envoi en cours...' : 'Envoyer mon avis'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewSubmissionView;
