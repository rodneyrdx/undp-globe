demo = function(tasks) {
   tasks.reverse();
   return new Promise(function (resolve, reject) {
      if (!tasks) return reject();

      nextTask();

      function nextTask() {
         if (!tasks.length) { 
            return resolve(); 
         }

         var task = tasks.pop();
         if (!task || !task.fx || !task.params) {
            nextTask();
         } else {
            // var i = task.fx(...task.params);  // not supported for mobile
            var i = task.fx.apply(this, task.params);
            if (Promise.resolve(i) == i) {
               i.then(nextTask, reject);
            } else {
               delayNext(task.delay);
            }
         }
      }

      function delayNext(delay) { 
         setTimeout(function() { nextTask(); }, delay); 
      }

   });
}
