class Kanban{
    constructor(selector){
        this.db = {
            boards: this.getBoardsFromLocalStorage(),
            tasks: this.getTasksFromLocalStorage(),
        }
        this.container = document.querySelector(selector);
        this.renderUI();
        this.addFunctionalityForAddBoardBtn();
    }

    getBoardsFromLocalStorage(){
        if(!localStorage.getItem("boards")){
            let boards = [
                {id: "KB0001", boardTitle: "To-Do", noOfTasks: 1, color: "color4"}
            ];
            return boards;
        }
        return JSON.parse(localStorage.getItem("boards"));
    }

    getTasksFromLocalStorage(){
        if(!localStorage.getItem("tasks")){
            let tasks = [
                {taskId: "KT0001", taskContent: "This is first task to do", boardId: "KB0001", orderIdx: 0}
            ];
            return tasks;
        }
        return JSON.parse(localStorage.getItem("tasks"));
    }

    saveBoards(){
        localStorage.setItem("boards", JSON.stringify(this.db.boards) );
    }
    
    saveTasks(){
        localStorage.setItem("tasks", JSON.stringify(this.db.tasks) );
    }
    
    getTasksByBoardId(boardId){
        let requiredtaskObjs =  this.db.tasks.filter( task => boardId == task.boardId );
        requiredtaskObjs.sort( (taskObj1, taskObj2)=>{
            if(taskObj1.orderIdx > taskObj2.orderIdx)
                return 1;
            return -1;
        });
        return requiredtaskObjs;
    }

    renderUI(){
        const frag = document.createDocumentFragment();
        for(let boardObj of this.db.boards){
            const newBoard = this.renderBoard(boardObj);
            frag.appendChild(newBoard);
        }
        this.container.innerHTML = '';
        this.container.appendChild(frag);
    }

    renderBoard(boardObj){
        const board = document.createElement("div");
        board.classList.add("board");
        board.classList.add(boardObj.color);
        board.id = boardObj.id;
        
        const delBoardBtn = document.createElement("button");
        delBoardBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        delBoardBtn.classList.add("delBoardBtn");
        board.appendChild(delBoardBtn);
        
        const boardTitle = document.createElement("h2");
        boardTitle.innerText = boardObj.boardTitle;
        boardTitle.classList.add("listTitle");
        boardTitle.contentEditable = true;
        board.appendChild(boardTitle);

        const inputSection = document.createElement("div");
        inputSection.classList.add("inputSection");
        board.appendChild(inputSection);

        const line1 = document.createElement("p");
        line1.className = "line line1";
        inputSection.appendChild(line1);

        const addTask = document.createElement("button");
        addTask.innerHTML = `<i class="fa-solid fa-plus"></i>`;
        addTask.classList.add("addTask");
        inputSection.appendChild(addTask);

        const line2 = document.createElement("p");
        line2.className = "line line2";
        inputSection.appendChild(line2);

        const list = document.createElement("ul");
        list.classList.add("list");
        board.appendChild(list);

        const footer = document.createElement("div");
        footer.classList.add("footer");
        board.appendChild(footer);

        const colorPltBtn = document.createElement("button")
        colorPltBtn.innerHTML = `<i class="fa-solid fa-palette"></i>`;
        colorPltBtn.classList.add("colorPltBtn");
        colorPltBtn.setAttribute("data-mode", "button");
        this.setEventListenerForColorPlt(colorPltBtn, board, boardObj);
        footer.appendChild(colorPltBtn);

        const p = document.createElement("p");
        p.innerText = `${boardObj.noOfTasks} task${boardObj.noOfTasks > 1 ? 's' : ''}`;
        p.classList.add("taskCount");
        footer.appendChild(p);

        //adding functionality for addTask button
        addTask.addEventListener("click", ()=>{
            let taskObj = {
                taskId: `KT${Date.now()}`, 
                taskContent: '',
                boardId: boardObj.id,
                orderIdx: boardObj.noOfTasks,
            };
            let task = this.renderTask(taskObj);
            list.appendChild(task);
            
            this.db.tasks.push(taskObj);
            this.saveTasks();

            boardObj.noOfTasks++;
            this.saveBoards();
            this.updateTaskCountUI(boardObj, board);

            let taskContent = task.querySelector(".taskTitle");
            taskContent.focus();
        });

        //adding functionality for delBoardBtn 
        delBoardBtn.addEventListener("click", ()=>{
            let deleteBoardConfirm = confirm("Are you sure you want to delete the board and all tasks present in it?");
            if(!deleteBoardConfirm)
                return;
            this.db.boards = this.db.boards.filter(curBoard => curBoard.id != boardObj.id);
            this.db.tasks = this.db.tasks.filter(curTask => curTask.boardId != boardObj.id);
            this.saveBoards();
            this.saveTasks();
            board.remove();
        });

        //board title editing functionality
        boardTitle.addEventListener("focusout", ()=>{
            boardObj.boardTitle = boardTitle.innerText;
            this.saveBoards();
        });
        boardTitle.addEventListener("keydown", event =>{
            if(event.key == "Enter")
                boardTitle.blur();
        });

        //rendering stored tasks
        let requiredtaskObjs = this.getTasksByBoardId(boardObj.id);
        let fragForTasks = document.createDocumentFragment();
        for(let taskObj of requiredtaskObjs){
            let task = this.renderTask(taskObj);
            fragForTasks.appendChild(task);
        }
        list.appendChild(fragForTasks);

        //board functionality to capture dropped task
        function updateDraggedTaskDetails(draggedTask){
            //updating boardId of task
            let index = this.db.tasks.findIndex(taskObj => taskObj.taskId == draggedTask.id);
            this.db.tasks[index].boardId = boardObj.id;
            //update order index of tasks
            this.updateTaskOrderIndices();
            this.saveTasks();

            //updating task count of board
            this.updateTaskCountUI();
            this.saveBoards();
        }
        let debouncedUpdaterFn = debouncer( updateDraggedTaskDetails.bind(this), 300 );
        board.addEventListener("dragover",  event=>{
            const draggedTask = document.querySelector(".dragged");
            const nearestTask = this.findNearestTask(board, event.clientY);
            if(nearestTask)
                list.insertBefore(draggedTask, nearestTask);
            else
                list.appendChild(draggedTask);

            debouncedUpdaterFn(draggedTask);
        });

        return board;
    }

    renderTask(taskObj){
        const task = document.createElement("li");
        task.classList.add("task");
        task.id = taskObj.taskId;

        const dragBtn = document.createElement("button");
        dragBtn.classList.add("dragBtn");
        dragBtn.innerHTML = `<i class="fa-solid fa-grip-lines-vertical"></i>`;
        task.appendChild(dragBtn);
    
        const taskTitle = document.createElement("p");
        taskTitle.classList.add("taskTitle");
        taskTitle.innerText = taskObj.taskContent;
        taskTitle.contentEditable = true;
        task.appendChild(taskTitle);

        const delBtn = document.createElement("button");
        delBtn.classList.add("delete");
        delBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
        task.appendChild(delBtn);

        //task editing facility
        taskTitle.addEventListener("blur", ()=>{
            if(taskTitle.textContent == ''){
                let deleteTask = confirm("The task is empty. Do you want to delete it?")
                if(deleteTask)
                    delBtnFn();
                else{
                    setTimeout(() => {
                        taskTitle.focus();
                    }, 0);
                }
            }
            else{
                taskObj.taskContent = taskTitle.innerText;
                this.saveTasks();
            }
        });
        taskTitle.addEventListener("keydown", event =>{
            if(event.key == "Enter")
                taskTitle.blur();
        });
    
        //adding functionality for delete button
        let delBtnFn = ()=>{
            task.remove();
            this.db.tasks = this.db.tasks.filter(curTask => curTask.taskId != taskObj.taskId);
            this.saveTasks();

            //update task count in board
            let boardIndex = this.db.boards.findIndex(board => board.id == taskObj.boardId);
            this.db.boards[boardIndex].noOfTasks--;
            this.saveBoards();
            this.updateTaskCountUI(this.db.boards[boardIndex]);
        }
        delBtn.addEventListener("click", delBtnFn);

        //facilitating task drag and drop functionality
        dragBtn.addEventListener("mousedown", () => {
            task.draggable = true;
            // Trigger dragstart on task when interacting with the dragBtn
            task.dispatchEvent(new DragEvent("dragstart", {
              bubbles: true,
              cancelable: true,
            }));
        });
        dragBtn.addEventListener("mouseup", () => {
            // Trigger dragend on task when interacting with the dragBtn
            task.dispatchEvent(new DragEvent("dragend", {
              bubbles: true,
              cancelable: true,
            }));
        });
        task.addEventListener("dragstart", ()=>{
            task.classList.add("dragged");
        });
        task.addEventListener("dragend", ()=>{
            task.classList.remove("dragged");
            task.draggable = false;
        });
    
        return task;
    }

    addFunctionalityForAddBoardBtn(){
        const addBoardBtn = document.querySelector(".addList");
        addBoardBtn.addEventListener("click", ()=>{
            const newBoardObj = {
                id: `KB${Date.now()}`,
                boardTitle: "New Board",
                noOfTasks: 0,
                color: "color4",
            };
            const newBoard = this.renderBoard(newBoardObj);
            this.container.appendChild(newBoard);

            this.db.boards.push(newBoardObj);
            this.saveBoards();
        });
    }

    findNearestTask(board, mouseY){
        let nearestTask = null;
        let minDistance = Number.POSITIVE_INFINITY;
        const existingTasks = board.querySelectorAll(".task:not(.dragged)");
        for(let existingTask of existingTasks){
            let distance = existingTask.getBoundingClientRect().top - mouseY;
            if(distance > 0 && distance < minDistance){
                minDistance = distance;
                nearestTask = existingTask;
            }
        }
        return nearestTask;
    }

    updateTaskCountUI(boardObj, board){
        if(!boardObj && !board){
            const boards = document.querySelectorAll(".board");
            boards.forEach(board => {
                let taskCount = board.querySelectorAll(".task").length;
                const taskCountUI = board.querySelector(".taskCount");
                taskCountUI.innerText = `${taskCount} task${taskCount > 1 ? 's' : ''}`;
                let index = this.db.boards.findIndex(obj => obj.id == board.id);
                this.db.boards[index].noOfTasks = taskCount;
            }); 
        }
        else{
            if(!board)
                board = document.getElementById(boardObj.id);
            const taskCountUI = board.querySelector(".taskCount");
            taskCountUI.innerText = `${boardObj.noOfTasks} task${boardObj.noOfTasks > 1 ? 's' : ''}`;
        }
    }

    updateTaskOrderIndices(){
        const boards = document.querySelectorAll(".board");
        boards.forEach(board => {
            let tasks = board.querySelectorAll(".task");
            tasks.forEach((task, index) =>{
                let dbIdx = this.db.tasks.findIndex(obj => task.id == obj.taskId);
                this.db.tasks[dbIdx].orderIdx = index;
            });
        }); 
    }

    setEventListenerForColorPlt(colorPltBtn, board, boardObj){
        colorPltBtn.addEventListener("mouseenter", ()=>{
            colorPltBtn.dataset.mode = "color-selection";
            colorPltBtn.innerHTML = `
                <button class = "color color1"></button>
                <button class = "color color2"></button>
                <button class = "color color3"></button>
                <button class = "color color4"></button>
            `;
        });
        colorPltBtn.addEventListener("mouseleave", ()=>{
            colorPltBtn.dataset.mode = "button";
            colorPltBtn.innerHTML = `<i class="fa-solid fa-palette"></i>`;
        });
        colorPltBtn.addEventListener("click", event=>{
            if(colorPltBtn.dataset.mode == "button" || event.target.classList[0] != "color")
                return;

            let colorClass = event.target.classList[1];
            for(let i=1; i<=4; i++){
                board.classList.remove(`color${i}`);
            }
            board.classList.add(colorClass);
            boardObj.color = colorClass;
            this.saveBoards();
        });
    }
}

function debouncer(func, delay){
    let timeoutId;
    return function(...args){
        clearTimeout(timeoutId);
        timeoutId = setTimeout(()=>{
            func(...args);
        }, delay);
    }
}

new Kanban(".container");