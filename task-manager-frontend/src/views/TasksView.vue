<template>
  <div class="tasks-view">
    <aside :class="['sidebar', { 'sidebar-closed': !isSidebarOpen }]">
      <div class="site-title">
        <img src="@/assets/logo_devel_task.png" alt="Devel Task Logo" class="site-logo" />
      </div>

      <button class="add-task-button" @click="showModal = true">
        <i class="fas fa-add"></i> Add new task
      </button>

      <ul class="menu-list">
        <li @click="setFilter('all')">All tasks</li>
        <li @click="setFilter('completed')">Completed tasks</li>
        <li @click="setFilter('uncompleted')">Uncompleted tasks</li>
      </ul>

      <div class="user-info">
        <div class="user-avatar">
          <div class="avatar">{{ userInitials }}</div>
          <p>Welcome, {{ username }}</p>
        </div>
        <button class="logout-button" @click="logout">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </aside>

    <div :class="['task-list', { 'task-list-expanded': !isSidebarOpen }]">
      <header class="header">
        <button class="toggle-sidebar-button" @click="toggleSidebar">
          <i :class="isSidebarOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i>
        </button>

        <input class="search-bar" type="search" placeholder="Search task" v-model="searchQuery" />
        <h2 class="h2-tasks">
          {{
            filterType === "all"
              ? "All tasks"
              : filterType === "completed"
                ? "Completed tasks"
                : "Uncompleted tasks"
          }}
          ({{ filteredTasks().length }} tasks)
        </h2>
      </header>
      <div class="tasks">
        <div class="tasks-grid">
          <div v-for="(task, index) in filteredTasks()" :key="task.id" :data-task-id="task.id"
            class="task-card-container" :draggable="true" @dragstart="onDragStart($event, index)"
            @dragenter.prevent="onDragEnter($event)" @dragover.prevent="onDragOver($event)"
            @dragleave="onDragLeave($event)" @drop="onDrop($event, index)">

            <TaskCard :id="task.id" :title="task.title" :cost="task.cost" :date="task.date" :completed="task.completed"
              :index="index" :confirm-delete="confirmedTaskId === task.id" @delete-task="confirmRemoveTask"
              @update-task="openUpdateTaskModal(task)" @move-up="handleMoveTask(index, 'up')"
              @move-down="handleMoveTask(index, 'down')" />
          </div>
        </div>
      </div>
    </div>

    <AddTaskModal :isVisible="showModal" @close="showModal = false" @add-task="addTask" />
    <UpdateTaskModal :isVisible="showUpdateModal" :task="selectedTask" @close="closeUpdateTaskModal"
      @update-task="updateTask" />

    <CustomAlert v-if="showErrorAlert" :message="errorMessage" type="error" @close="showErrorAlert = false" />

    <CustomAlert v-if="showConfirmAlert" :message="'Are you sure you want to delete this task?'" type="warn"
      :confirm="true" @confirm="removeTask" @close="showConfirmAlert = false" />
  </div>
</template>

<script>
import TaskCard from "../components/Task Card/TaskCard.vue";
import AddTaskModal from "../components/addTaskModal/AddTaskModal.vue";
import UpdateTaskModal from "../components/updateTaskModal/UpdateTaskModal.vue";
import CustomAlert from "../components/alert/CustomAlert.vue";
import axios from "axios";
import Cookies from "js-cookie";

export default {
  components: {
    TaskCard,
    AddTaskModal,
    UpdateTaskModal,
    CustomAlert,
  },
  data() {
    return {
      tasks: [],
      showModal: false,
      showUpdateModal: false,
      selectedTask: null,
      username: "",
      userInitials: "",
      filterType: "all",
      showConfirmAlert: false,
      taskToDelete: null,
      confirmedTaskId: null,
      showErrorAlert: false,
      errorMessage: "",
      draggedTaskIndex: null,
      targetTaskIndex: null,
      isSidebarOpen: true,
      searchQuery: "",
    };
  },
  methods: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    getUserInitials(name) {
      const names = name.split(" ");
      if (names.length === 1) return names[0][0].toUpperCase();
      return (
        names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase()
      );
    },
    getFirstName(name) {
      return name.split(" ")[0];
    },
    async fetchTasks() {
      this.username = Cookies.get("user");
      this.userInitials = this.getUserInitials(this.username);
      this.username = this.getFirstName(this.username);
      const response = await axios.get(
        `https://api.itmf.app.br/tasks/${this.username}`
      );
      this.tasks = response.data.sort((a, b) => a.id - b.id);
    },
    async addTask(newTask) {
      try {
        await axios.post("https://api.itmf.app.br/tasks/create", newTask);
        await this.fetchTasks();
      } catch (error) {
        if (error.response && error.response.status === 409) {
          this.errorMessage = "Uma task com esse nome já existe!";
          this.showErrorAlert = true;
        } else {
          console.error("Erro ao adicionar tarefa:", error);
        }
      }
    },
    confirmRemoveTask(taskId) {
      this.taskToDelete = taskId;
      this.showConfirmAlert = true;
    },
    async removeTask() {
      try {
        if (this.taskToDelete !== null) {
          this.confirmedTaskId = this.taskToDelete;

          await axios.delete(`https://api.itmf.app.br/tasks/${this.taskToDelete}`);

          const updatedTasks = [...this.tasks];
          const deletedTaskIndex = updatedTasks.findIndex(
            (task) => task.id === this.taskToDelete
          );
          if (deletedTaskIndex !== -1) {
            updatedTasks.splice(deletedTaskIndex, 1);
          }

          const reorganizedTasks = updatedTasks.map((task) => {
            if (task.id > this.taskToDelete) {
              return {
                ...task,
                id: task.id - 1,
              };
            }
            return task;
          });

          this.$nextTick(() => {
            this.tasks = [];
            this.$nextTick(() => {
              this.tasks = reorganizedTasks;
            });
          });

          this.taskToDelete = null;
          this.confirmedTaskId = null;
          this.showConfirmAlert = false;
        }
      } catch (error) {
        console.error("Error removing task:", error);
      }
    },
    async updateTask(updatedTask) {
      try {
        await axios.put(
          `https://api.itmf.app.br/tasks/${updatedTask.id}`,
          updatedTask
        );

        const taskIndex = this.tasks.findIndex(task => task.id === updatedTask.id);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            ...updatedTask
          };

          this.tasks = [...this.tasks].sort((a, b) => a.id - b.id);
        }

        this.closeUpdateTaskModal();
      } catch (error) {
        console.error("Error updating task:", error);
        this.errorMessage = "Error updating task";
        this.showErrorAlert = true;
      }
    },
    openUpdateTaskModal(task) {
      if (task) {
        this.selectedTask = task;
        this.showUpdateModal = true;
      } else {
        console.error("Task is null or undefined:", task);
      }
    },
    closeUpdateTaskModal() {
      this.selectedTask = null;
      this.showUpdateModal = false;
    },
    logout() {
      Cookies.remove("user");
      this.$router.push("/");
    },
    setFilter(type) {
      this.filterType = type;
    },
    filteredTasks() {
      let tasks = [];
      if (this.filterType === "completed") {
        tasks = this.tasks.filter((task) => task.completed === true);
      } else if (this.filterType === "uncompleted") {
        tasks = this.tasks.filter((task) => task.completed === false);
      } else {
        tasks = this.tasks;
      }

      if (this.searchQuery) {
        tasks = tasks.filter((task) =>
          task.title.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }

      return tasks;
    },
    onDragStart(event, index) {
      this.draggedTaskIndex = index;
      event.dataTransfer.effectAllowed = 'move';
      const taskCard = event.target.closest('.task-card-container');
      taskCard.classList.add('dragging');
    },
    onDragEnter(event) {
      const taskCard = event.target.closest('.task-card-container');
      if (taskCard && !taskCard.classList.contains('dragging')) {
        taskCard.classList.add('target');
      }
    },
    onDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    onDragLeave(event) {
      const taskCard = event.target.closest('.task-card-container');
      if (taskCard) {
        taskCard.classList.remove('target');
      }
    },
    async updateTasksOrder(task1Id, task1Updates, task2Id, task2Updates) {
      try {
        await Promise.all([
          axios.put(`https://api.itmf.app.br/tasks/${task1Id}`, task1Updates),
          axios.put(`https://api.itmf.app.br/tasks/${task2Id}`, task2Updates)
        ]);

        await this.fetchTasks();
      } catch (error) {
        console.error("Error updating tasks order:", error);
        this.errorMessage = "Error updating tasks order";
        this.showErrorAlert = true;

        await this.fetchTasks();
      }
    },
    async onDrop(event, dropIndex) {
      event.preventDefault();

      const draggedTask = this.tasks[this.draggedTaskIndex];
      const targetTask = this.tasks[dropIndex];

      const draggedTaskUpdates = {
        id: draggedTask.id,
        title: targetTask.title,
        cost: targetTask.cost,
        date: targetTask.date,
        completed: targetTask.completed
      };

      const targetTaskUpdates = {
        id: targetTask.id,
        title: draggedTask.title,
        cost: draggedTask.cost,
        date: draggedTask.date,
        completed: draggedTask.completed
      };

      this.tasks = this.tasks.map(task => {
        if (task.id === draggedTask.id) {
          return { ...task, ...draggedTaskUpdates };
        }
        if (task.id === targetTask.id) {
          return { ...task, ...targetTaskUpdates };
        }
        return task;
      });

      this.clearDragStates();

      await this.updateTasksOrder(
        draggedTask.id,
        draggedTaskUpdates,
        targetTask.id,
        targetTaskUpdates
      );
    },
    clearDragStates() {
      document.querySelectorAll('.task-card-container').forEach(el => {
        el.classList.remove('dragging', 'target');
      });

      this.draggedTaskIndex = null;
    },
    handleMoveUp() {
      this.$emit('move-up');
    },
    handleMoveDown() {
      this.$emit('move-down');
    },
    async handleMoveTask(taskIndex, direction) {
      const tasks = this.filteredTasks();

      if (direction === 'up' && taskIndex === 0) return;
      if (direction === 'down' && taskIndex === tasks.length - 1) return;

      const targetIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;

      const currentTask = tasks[taskIndex];
      const targetTask = tasks[targetIndex];

      const currentTaskUpdates = {
        id: currentTask.id,
        title: targetTask.title,
        cost: targetTask.cost,
        date: targetTask.date,
        completed: targetTask.completed
      };

      const targetTaskUpdates = {
        id: targetTask.id,
        title: currentTask.title,
        cost: currentTask.cost,
        date: currentTask.date,
        completed: currentTask.completed
      };

      this.tasks = this.tasks.map(task => {
        if (task.id === currentTask.id) {
          return { ...task, ...currentTaskUpdates };
        }
        if (task.id === targetTask.id) {
          return { ...task, ...targetTaskUpdates };
        }
        return task;
      });

      await this.updateTasksOrder(
        currentTask.id,
        currentTaskUpdates,
        targetTask.id,
        targetTaskUpdates
      );
    },
  },
  created() {
    this.fetchTasks();
  },
};
</script>

<style scoped>
.h2-tasks {
  font-size: 1.5em;
  font-weight: bold;
  unicode-bidi: isolate;
  margin-left: 10px;
}


.tasks-view {
  display: flex;
  height: 100vh;
  background-color: #f4f4f9;
  color: #4a4a4a;
  font-family: Arial, sans-serif;
  transition: all 0.3s ease;
}

.sidebar {
  width: 15%;
  min-width: 200px;
  background-color: #fbfcf8;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: width 0.3s ease, opacity 0.3s ease;
}

.sidebar.sidebar-closed {
  width: 0;
  padding: 0;
  overflow: hidden;
  opacity: 0;
  display: none;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.user-avatar {
  display: flex;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #a35eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
}

.user-info p {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  margin-left: 10px;
}

.logout-button {
  padding: 8px 12px;
  background-color: transparent;
  color: rgb(0, 0, 0);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-button i {
  margin-left: 8px;
}

.logout-button:hover {
  color: #a35eff;
}

.task-list {
  width: 85%;
  padding: 20px;
  height: calc(100vh - 40px);
  overflow-y: auto;
  transition: width 0.3s ease;
}

.task-list.task-list-expanded {
  width: 100%;
}

.toggle-sidebar-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  margin-right: 10px;
  transition: transform 0.3s ease;
}

.toggle-sidebar-button:hover {
  color: #a35eff;
}

.info-panel {
  width: 25%;
  background-color: #fbfcf8;
  padding: 20px;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
}

.site-title {
  margin-bottom: 20px;
  text-align: center;
  flex-shrink: 0;
}

.site-logo {
  max-width: 100%;
  height: auto;
  margin-right: 10px;
}

.site-title h1 {
  font-size: 24px;
  color: #333;
}

.add-task-button {
  display: block;
  width: 100%;
  padding: 10px;
  background: linear-gradient(to right, #7a2290, #0360ca);
  color: white;
  border: none;
  border-radius: 5px;
  margin-bottom: 20px;
  cursor: pointer;
}

.menu-list {
  list-style-type: none;
  padding: 0;
  flex-grow: 1;
  margin-bottom: auto;
  margin-top: auto;
}

.menu-list li {
  margin: 0;
  cursor: pointer;
  text-align: left;
  padding: 10px 15px;
  transition: background-color 0.3s ease, color 0.3s ease;
  position: relative;
  width: calc(100% + 5px);
  left: -15px;
}

.menu-list li:hover {
  background-color: #f3e7f7;
  color: #a35eff;
}

.menu-list li:hover::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 4px;
  background-color: #a35eff;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar {
  width: 40%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.task-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff7b89;
  color: white;
  padding: 5px;
  border-radius: 3px;
  font-size: 12px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.task-date {
  font-size: 12px;
}

.task-status {
  padding: 5px;
  border-radius: 5px;
  font-size: 12px;
}

.task-status.completed {
  background-color: #00d68f;
  color: white;
}

.task-status.uncompleted {
  background-color: #ffda44;
  color: white;
}

.task-actions {
  display: flex;
  gap: 10px;
}

.task-actions i {
  cursor: pointer;
}

.info-panel p {
  margin-bottom: 10px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  width: 100%;
}

.task-card-container {
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease;
  cursor: move;
  display: flex;
}

.task-card-container.dragging {
  opacity: 0.5;
  transform: scale(1.02);
}

.task-card-container.target {
  position: relative;
}

.task-card-container.target::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed #a35eff;
  border-radius: 8px;
  pointer-events: none;
  z-index: 1;
}
</style>
