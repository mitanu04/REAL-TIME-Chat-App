import { Component,ElementRef,inject, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { TitleCasePipe } from '@angular/common';
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from '@angular/forms';
import { Chat } from "../../chat/chat";
import { ChatBox } from "../chat-box/chat-box";



@Component({
  selector: 'app-chat-window',
  imports: [TitleCasePipe, MatIcon, MatFormFieldModule, MatIconModule, FormsModule, ChatBox],
  templateUrl: './chat-window.html',
  styles: ``,
})
export class ChatWindow {
  @ViewChild('messageInput') chat?: ElementRef;
  chatService=inject(ChatService);
  message: string='';
  sendMessage(){
    if(!this.message) return;
    this.chatService.sendMessage(this.message);
    this.message='';
    this.scrollBottom();
  }


  private scrollBottom(){

    if(this.chat){
      this.chat.nativeElement.scrollTop = 
      this.chat.nativeElement.scrollHeight;
    }
  }
}
