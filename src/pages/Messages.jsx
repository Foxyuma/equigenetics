import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Send, Inbox, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Messages() {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 100),
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      const recipient = users.find(u => u.email === recipientEmail);
      return base44.entities.Message.create({
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        recipient_email: recipientEmail,
        recipient_name: recipient?.full_name || recipientEmail,
        subject: subject || 'Sans objet',
        content,
        is_read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setNewMessageOpen(false);
      setRecipientEmail('');
      setSubject('');
      setContent('');
      toast.success('Message envoyé !');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSelectedMessage(null);
      toast.success('Message supprimé');
    },
  });

  const receivedMessages = messages.filter(m => m.recipient_email === currentUser?.email);
  const sentMessages = messages.filter(m => m.sender_email === currentUser?.email);
  const unreadCount = receivedMessages.filter(m => !m.is_read).length;

  const handleOpenMessage = (msg) => {
    setSelectedMessage(msg);
    if (!msg.is_read && msg.recipient_email === currentUser?.email) {
      markReadMutation.mutate(msg.id);
    }
  };

  const MessageList = ({ messages, type }) => (
    <div className="space-y-2">
      {messages.length === 0 ? (
        <p className="text-center text-stone-400 py-8">Aucun message</p>
      ) : (
        messages.map(msg => (
          <div
            key={msg.id}
            onClick={() => handleOpenMessage(msg)}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              selectedMessage?.id === msg.id
                ? 'bg-indigo-50 border-2 border-indigo-200'
                : !msg.is_read && type === 'received'
                ? 'bg-blue-50 hover:bg-blue-100 border-2 border-blue-200'
                : 'bg-stone-50 hover:bg-stone-100 border-2 border-transparent'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-stone-800 text-sm">
                    {type === 'received' ? msg.sender_name : msg.recipient_name}
                  </p>
                  {!msg.is_read && type === 'received' && (
                    <Badge className="bg-blue-600 text-white border-0 text-xs">Nouveau</Badge>
                  )}
                </div>
                <p className="text-xs text-stone-500">{msg.subject || 'Sans objet'}</p>
              </div>
              <span className="text-xs text-stone-400">
                {format(new Date(msg.created_date), 'dd/MM HH:mm')}
              </span>
            </div>
            <p className="text-sm text-stone-600 line-clamp-2">{msg.content}</p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Messagerie</h1>
          <p className="text-stone-500 mt-1">Communiquez avec les autres joueurs</p>
        </div>
        <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4 mr-2" />
              Nouveau Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-600 mb-2 block">Destinataire</label>
                <select
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-stone-200 text-sm"
                >
                  <option value="">Sélectionner un joueur...</option>
                  {users.filter(u => u.email !== currentUser?.email).map(u => (
                    <option key={u.id} value={u.email}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-600 mb-2 block">Sujet</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Objet du message..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-600 mb-2 block">Message</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Votre message..."
                  rows={6}
                />
              </div>
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={!recipientEmail || !content}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Inbox className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-800">{receivedMessages.length}</p>
            <p className="text-xs text-blue-600">Messages reçus</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-purple-50">
          <CardContent className="p-4 text-center">
            <Mail className="w-6 h-6 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-800">{unreadCount}</p>
            <p className="text-xs text-purple-600">Non lus</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 bg-white/60">
          <CardHeader>
            <CardTitle className="text-lg">Boîte de réception</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            <MessageList messages={receivedMessages} type="received" />
          </CardContent>
        </Card>

        {selectedMessage ? (
          <Card className="border-0 bg-white/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Message</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500"
                onClick={() => deleteMutation.mutate(selectedMessage.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-stone-500 mb-1">
                  De: <strong>{selectedMessage.sender_name}</strong> ({selectedMessage.sender_email})
                </p>
                <p className="text-xs text-stone-500 mb-1">
                  À: <strong>{selectedMessage.recipient_name}</strong>
                </p>
                <p className="text-xs text-stone-500">
                  {format(new Date(selectedMessage.created_date), 'dd/MM/yyyy à HH:mm')}
                </p>
              </div>
              <div className="border-t border-stone-200 pt-4">
                <h3 className="font-semibold text-stone-800 mb-2">{selectedMessage.subject || 'Sans objet'}</h3>
                <p className="text-sm text-stone-600 whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
              <Button
                onClick={() => {
                  setRecipientEmail(selectedMessage.sender_email);
                  setSubject(`Re: ${selectedMessage.subject || 'Sans objet'}`);
                  setNewMessageOpen(true);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Répondre
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-gradient-to-br from-stone-50 to-indigo-50">
            <CardContent className="p-12 text-center">
              <Mail className="w-16 h-16 mx-auto text-stone-300 mb-4" />
              <h3 className="text-lg font-semibold text-stone-600 mb-2">Aucun message sélectionné</h3>
              <p className="text-stone-400">Cliquez sur un message pour le lire</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}