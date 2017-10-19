function chunk (array) {
    setTimeout(function (){
        const task = array.shift();
        task.handler(task.context, task.params);
        if (array.length > 0) setTimeout(arguments.callee, 100);
    });
};