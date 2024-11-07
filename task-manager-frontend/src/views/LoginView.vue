<template>
  <div class="login-container">
    <div class="login-left">
      <img src="@/assets/logo_devel_task.png" alt="Login Illustration" />
      <h2>Sign in</h2>
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <input type="text" placeholder="Username" v-model="username"
            @input="username = $event.target.value.replace(/[^a-zA-Z0-9]/g, '')" maxlength="10" />
        </div>
        <div class="input-group">
          <input type="password" placeholder="Password" v-model="password" />
        </div>
        <button type="submit" class="btn-signin">{{ signupButtonText }}</button>
        <a href="#" class="create-account" @click.prevent="toggleSignup">{{ accountActionText }}</a>
      </form>
      <div class="footer">
        <span>powered by</span>
        <a href="https://github.com/lugafaell" target="_blank">
          <font-awesome-icon :icon="['fab', 'github']" class="github-icon" />
        </a>
        <strong>
          <a href="https://github.com/lugafaell" target="_blank" class="github-link">
            Lugafael
          </a>
        </strong>
      </div>
    </div>
    <div class="login-right">
      <h1 class="typing-animation">{{ typingText }}</h1>
      <p>Your organization tasks app</p>
    </div>
    <CustomAlert v-if="showAlert" :message="alertMessage" :type="alertType" @close="showAlert = false" />
  </div>
</template>

<script>
import axios from "axios";
import CustomAlert from "../components/alert/CustomAlert.vue";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faGithub);

export default {
  name: "LoginView",
  components: {
    CustomAlert,
    FontAwesomeIcon,
  },
  mounted() {
    this.checkLogin();
    this.typeWriter();
  },
  watch: {
    username(newValue) {
      this.username = newValue.replace(/[^a-zA-Z0-9]/g, '');
    }
  },
  data() {
    return {
      username: "",
      password: "",
      typingText: "",
      fullText: "Welcome to Devel Task!",
      currentIndex: 0,
      showAlert: false,
      alertMessage: "",
      alertType: "success",
      isSignupMode: false,
    };
  },
  computed: {
    accountActionText() {
      return this.isSignupMode ? "Back to Login" : "Create Your Account";
    },
    signupButtonText() {
      return this.isSignupMode ? "SIGN UP" : "SIGN IN";
    },
  },
  methods: {
    async handleLogin() {
      if (this.isSignupMode) {
        try {
          const response = await axios.post("https://api.itmf.app.br/users", {
            username: this.username,
            password: this.password,
          });

          if (response.data.message === "Register successful") {
            this.showAlert = true;
            this.alertMessage = "Register successful";
            this.alertType = "success";
            setTimeout(() => {
              this.isSignupMode = !this.isSignupMode;
            }, 1500);
          } else {
            this.showAlert = true;
            this.alertMessage = "Ocorreu um erro. Tente novamente.";
            this.alertType = "error";
          }
        } catch (error) {
          console.error("Erro durante o Registro:", error);
          this.showAlert = true;

          if (error.response && error.response.data.message === "Username already exists") {
            this.alertMessage = "Nome de usuário já existe. Tente outro.";
          } else {
            this.alertMessage = "Ocorreu um erro durante o Registro. Tente novamente mais tarde";
          }

          this.alertType = "error";
        }
      } else {
        try {
          const response = await axios.post("https://api.itmf.app.br/users/login", {
            username: this.username,
            password: this.password,
          });

          if (response.data.message === "Login successful") {
            Cookies.set("user", this.username, { expires: 7 });
            this.showAlert = true;
            this.alertMessage = "Login successful";
            this.alertType = "success";
            setTimeout(() => {
              this.$router.push("/tasks");
            }, 1500);
          } else {
            this.showAlert = true;
            this.alertMessage = "Credenciais inválidas. Tente novamente.";
            this.alertType = "error";
          }
        } catch (error) {
          console.error("Erro durante o login:", error);
          this.showAlert = true;
          this.alertMessage = "Ocorreu um erro durante o Login. Tente novamente mais tarde";
          this.alertType = "error";
        }
      }
    },
    toggleSignup() {
      this.isSignupMode = !this.isSignupMode;
    },
    typeWriter() {
      if (this.currentIndex < this.fullText.length) {
        this.typingText += this.fullText.charAt(this.currentIndex);
        this.currentIndex++;
        setTimeout(this.typeWriter, 100);
      }
    },
    checkLogin() {
      const user = Cookies.get("user");
      if (user) {
        this.$router.push("/tasks");
      }
    },
  },
};
</script>

<style scoped>
body {
  display: block;
  margin: 0;
}

.login-container {
  display: flex;
  height: 100vh;
}

.login-left,
.login-right {
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.login-left {
  background-color: #fbfcf8;
  padding: 20px;
}

.login-left img {
  width: 200px;
  margin-bottom: 20px;
}

.login-left h2 {
  margin-bottom: 30px;
}

.footer {
  position: absolute;
  bottom: 20px;
  left: 24.5%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  color: #7a2290;
  text-align: center;
}

.github-icon {
  font-size: 20px;
  color: #7a2290;
}

.github-link {
  text-decoration: none;
  color: #7a2290;
  font-weight: bold;
}

.github-link:hover {
  text-decoration: underline;
}

.input-group {
  margin-bottom: 20px;
  width: 100%;
  border: none;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: none;
  border-bottom: 1.5px solid #ababab;
  box-sizing: border-box;
  background-color: #fbfcf8;
}

.btn-signin {
  width: 100%;
  padding: 10px;
  background: linear-gradient(to right, #7a2290, #0360ca);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 40px;
  margin-bottom: 20px;
}

.btn-signin:hover {
  background: linear-gradient(to right, #5712a1, #164597);
}

.create-account {
  margin-top: 10px;
  color: #007bff;
  text-decoration: none;
  font-size: 14px;
}

.create-account:hover {
  text-decoration: underline;
}

.login-right {
  background: linear-gradient(to right, #7a2290, #0360ca);
  color: #ffffff;
  text-align: center;
  padding: 20px;
}

.login-right h1 {
  margin-bottom: 20px;
}

.login-right p {
  margin-bottom: 30px;
}

.typing-animation {
  border-right: 2px solid #fff;
  white-space: nowrap;
  overflow: hidden;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .login-left {
    width: 100%;
  }

  .login-right {
    display: none;
  }

  .footer {
    position: absolute;
    bottom: -30px;
    left: 55%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    color: #7a2290;
    text-align: center;
  }
}
</style>
