import { html, customElement, property } from "lit-element";
import { firestore } from "../../firebase";
import { orderBy } from "lodash-es";

import BaseComponent from "../base_component";

interface Document<T> extends firebase.firestore.QueryDocumentSnapshot {
  data(): T;
}

interface Message {
  name?: string;
  text: string;
  timestamp: number;
}

@customElement("x-guestbook")
export default class Guestbook extends BaseComponent {
  @property() private name = "";
  @property() private messageText = "";
  @property() private messages: Document<Message>[] = [];
  @property() private isLoading = true;

  queryData(): () => void {
    return firestore
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(20)
      .onSnapshot(snapshot => {
        for (const change of snapshot.docChanges()) {
          if (change.type === "removed" || change.type === "modified") {
            this.messages = this.messages.filter(m => m.id !== change.doc.id);
          }
          if (change.type === "added" || change.type === "modified") {
            this.messages = [...this.messages, change.doc as Document<Message>];
          }
        }
        this.messages = orderBy(this.messages, m => m.data().timestamp, "desc");
        this.isLoading = false;
      });
  }

  queryUnsubscribe!: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.queryUnsubscribe = this.queryData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.queryUnsubscribe();
  }

  onNameInput(event: Event) {
    this.name = (event.target as HTMLInputElement).value;
  }

  onMessageInput(event: Event) {
    this.messageText = (event.target as HTMLTextAreaElement).value;
  }

  onMessagePost(event: any) {
    event.preventDefault();
    const newMessageText = this.messageText;
    this.messageText = "";
    firestore.collection("messages").add({
      name: this.name === "" ? null : this.name,
      text: newMessageText,
      timestamp: Date.now()
    });
  }

  renderForm() {
    return html`
      <form>
        <div class="field is-horizontal">
          <div class="field-label is-normal">
            <label class="label" for="name">Name</label>
          </div>
          <div class="field-body">
            <div class="field">
              <p class="control">
                <input
                  id="name"
                  class="input"
                  type="text"
                  placeholder="Enter your name"
                  maxlength="30"
                  @input=${this.onNameInput}
                  .value=${this.name}
                />
              </p>
            </div>
          </div>
        </div>
        <div class="field is-horizontal">
          <div class="field-label is-normal">
            <label class="label" for="message">Message</label>
          </div>
          <div class="field-body">
            <div class="field">
              <p class="control">
                <textarea
                  id="message"
                  class="textarea"
                  placeholder="Enter your message"
                  maxlength="200"
                  @input=${this.onMessageInput}
                  .value=${this.messageText}
                ></textarea>
              </p>
            </div>
          </div>
        </div>
        <div class="field is-grouped is-grouped-right">
          <div class="control">
            <button
              class="button is-info"
              type="submit"
              @click=${this.onMessagePost}
              ?disabled=${this.messageText === ""}
            >
              Post message
            </button>
          </div>
        </div>
      </form>
    `;
  }

  renderMessages() {
    if (this.isLoading) {
      return html`
        <p>Loading...</p>
      `;
    } else if (this.messages.length > 0) {
      return html`
        <ul>
          ${this.messages.map(message => {
            const { name, text, timestamp } = message.data();
            const localeString = new Date(timestamp).toLocaleString();
            return html`
              <li>
                <em>${localeString}</em> -
                <strong>${name ? name : "Anonymous"}</strong> -
                <span>${text}</span>
              </li>
            `;
          })}
        </ul>
      `;
    } else {
      return html`
        <p>No messages yet.</p>
      `;
    }
  }

  render() {
    return html`
      <section class="section">
        <div class="container">
          <div class="content">
            <h1>Guestbook</h1>
            <p>
              Type a short message for the whole world to see.
            </p>
          </div>
          <div class="columns">
            <div class="column is-two-thirds-tablet is-half-desktop">
              ${this.renderForm()}
            </div>
          </div>
          <hr />
          <div class="content">
            <h2>Visitor messages</h2>
            ${this.renderMessages()}
          </div>
        </div>
      </section>
    `;
  }
}
