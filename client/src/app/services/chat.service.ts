import { inject, Injectable, signal } from '@angular/core';
import {User} from '../models/user';
import { AuthService } from './auth.service';
import {HubConnection, HubConnectionBuilder, HubConnectionState} from '@microsoft/signalr'
import { Message } from '../models/message';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  private authService = inject(AuthService);
  //private hubUrl ='http://localhost:5000/chatHub';
  //private hubUrl = 'https://xxxx-xxxx-xxxx.ngrok-free.app/chatHub';
  private hubUrl = `${environment.hubUrl}/chatHub`;
  onlineUsers = signal<User[]>([]);
  currentOpenedChat = signal<User|null>(null);
  chatMessages = signal<Message[]>([]);
  isLoading = signal<boolean>(true);

  autoScrollEnabled = signal<boolean>(true);

  private hubConnection?: HubConnection;

  startConnection(token:string, senderId?:string){

    if(this.hubConnection?.state === HubConnectionState.Connected) return;

    if(this.hubConnection)
    {
      this.hubConnection.off('ReceiveNewMessage');
      this.hubConnection.off('ReceiveMessageList');
      this.hubConnection.off('OnlineUsers');
      this.hubConnection.off('NotifyTypingToUser');
      this.hubConnection.off('Notify');

    }


    if (!token) {
    console.error("❌ Token is null or undefined!");
    return;
  }
  
  console.log("🔑 Token used for SignalR:", token.substring(0, 20) + "...");

  this.hubConnection = new HubConnectionBuilder()
    .withUrl(`${this.hubUrl}?access_token=${token}&senderId=${senderId || ''}`)
    .withAutomaticReconnect()
    .build();

  
  this.hubConnection!.on("NotifyTypingToUser", (senderUserName) => {
  // setezi isTyping = true
  this.onlineUsers.update((users) =>
    users.map((user) =>
      user.userName === senderUserName
        ? { ...user, isTyping: true }
        : user
    )
  );

  // după 2 secunde resetezi isTyping = false
  setTimeout(() => {
    this.onlineUsers.update((users) =>
      users.map((user) =>
        user.userName === senderUserName
          ? { ...user, isTyping: false }
          : user
      )
    );
  }, 2000);
});

  this.hubConnection!.on('ReceiveMessage', (message: Message) => {
    let audio = new Audio('assets/notification.mp3');
    audio.play();
    this.chatMessages.update(messages => [...messages, message]);
  });

  this.hubConnection!.on('ReceiveMessageList', (message: Message[]) => {
    this.chatMessages.update(messages => [...message, ...messages]);
    this.isLoading.update(() => false);
  });

  this.hubConnection!.on('OnlineUsers', (users: User[]) => {
  console.log("OnlineUsers received:", users);

  

  this.onlineUsers.set(
    users.filter(
      user => user.userName !== this.authService.currentLoggedUser!.userName
    )
  );
});

  this.hubConnection.start()
    .then(() => {
      console.log("Connection started");
    })
    .catch((error) => {
      console.log("Connection or login error", error);
    });

    

}




  disConnectCoonection(){
    if(this.hubConnection?.state == HubConnectionState.Connected){
      this.hubConnection.stop().catch((error) => console.log(error));
    }
  }

  sendMessage(message : string) {
    

    this.hubConnection?.invoke("SendMessage",{
      receiverId: this.currentOpenedChat()!.id,
      content: message
    })
    .then((id) => {
      console.log('Message sent to', id);
    })
    .catch((error)=>{
      console.log(error);
    });
}


  status(userName: string): string {
    const currentChatUser= this.currentOpenedChat();
    if(!currentChatUser){
      return 'offline';
}
  const onlineUser = this.onlineUsers().find(
    (user) => user.userName === userName
  );

  return onlineUser?.isTyping ? 'Typing...' : this.isUserOnline();;
  }

  isUserOnline() : string {
    let onlineUser = this.onlineUsers().find(
      (user)=> user.userName=== this.currentOpenedChat()?.userName
    );
    return onlineUser?.isOnline ? 'online' : 'offline';
  }


  loadMessages(pageNumber: number){
  this.isLoading.update(() => true);
  console.log("LoadMessages called for:", this.currentOpenedChat()?.id);
  this.hubConnection
    ?.invoke("LoadMessages", this.currentOpenedChat()?.id, pageNumber)
    .then((result) => console.log("LoadMessages result:", result))
    .catch((err) => console.log("LoadMessages error:", err))
    .finally(() => {
      this.isLoading.update(() => false);
    });
}



notifyTyping(){
  this.hubConnection!.invoke("NotifyTyping", this.currentOpenedChat()?.userName)
  .then((x) =>{
    console.log("notify for", x)})
    .catch((error) =>{
    console.log(error);
  })
}

}
