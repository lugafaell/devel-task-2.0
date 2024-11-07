import { createRouter, createWebHistory } from "vue-router";
import TasksView from "../views/TasksView.vue";
import LoginView from "../views/LoginView.vue";
import Cookies from "js-cookie";

const routes = [
  {
    path: "/tasks",
    name: "Tasks",
    component: TasksView,
    beforeEnter: (to, from, next) => {
      const user = Cookies.get("user");
      if (!user) {
        next("/");
      } else {
        next();
      }
    },
  },
  {
    path: "/",
    name: "Login",
    component: LoginView,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
