var EVH1 = new (require('../lib/eventHorizon'))();
var EVH2 = new (require('../lib/eventHorizon'))();
const TessCluster = require('../lib/clusterRedis')


var node1 = new TessCluster()
let node2 = new TessCluster()
let messageQueueDefinition = {
    clusterSync: true,
    persistent: true,
    columns: [{
        name: 'id',
        primaryKey: true,
    }, {
        name: 'message',
    }, {
        name: 'status',
        aggregator: 'avg'
    }, {
        name: 'user',
        columnType: 'number'
    }, {
        name: 'releaseTime',
        value: () => new Date(),
        aggregator: 'max'
    }]
}
var usersDefinition = {
    clusterSync: true,
    persistent: true,
    columns: [{
        name: 'id',
        columnType: 'number',
        primaryKey: true,
        //value: (data) => { return data.id || self.guid() }
    }, {
        name: 'name',
        columnType: 'text',
    }]
}

node1.connect({clientName: 'client1', syncSchema: false})
    .then((nc) => {
        console.log('node1 online')
        node1.createTesseract('users', usersDefinition)

        node1.createTesseract('messages', messageQueueDefinition)
    })

node2.connect({clientName: 'client2', syncSchema: false})
    .then((nc) => {
        console.log('node2 online')
        
    })


Promise.all([
    node2.pullTesseract('messages'),
    node2.pullTesseract('users')   
]).then(()=>{
    let users = node2.get('users')
    let messages = node2.get('messages')

    console.log('users before',users.getData().map(x=>x.object))
    console.log('messages before',messages.getData().map(x=>x.object))
    users.clear()
    messages.clear()
    console.log('users after',users.getData().map(x=>x.object))
    console.log('messages after',messages.getData().map(x=>x.object))
    
    users.add([{id: 1, name: 'rafal'},{id: 2, name: 'daniel'},{id: 3, name: 'lauren'}])

    let ii = 1
    messages.add({id: ii++, message: 'dupa', user: 3, status: 1})
    messages.add({id: ii++, message: 'cipa', user: 1, status: 1})
    messages.add({id: ii++, message: 'bla', user: 2, status: 1})
    messages.add({id: ii++, message: 'bla2', user: 2, status: 2})
    messages.add({id: ii++, message: 'bla3', user: 2, status: 2})

    messages.update({id: 2, message: 'cipa2', status: 2})
    messages.update([{id: 5, message: 'retretrt', status: 1}, {id: 4, message: 'cipa3', status: 2}])
    messages.remove([1, 2])

    
    
    let session = node2.createSession({
        id: 'messages_querry',
        table: 'messages',
        columns:  [{
            name: 'id',
            primaryKey: true
        },{
            name: 'message',
        },{
            name: 'status',
        },{
            name: 'userName',
            resolve: {
                underlyingField: 'user',
                childrenTable: 'users',
                valueField: 'id',
                displayField: 'name'
            }
        }],
        filter: [{
            type: 'custom',
            value: 'status == 2',
        }],
        sort: [{ field: 'id', direction: 'desc' }]
    })

    setTimeout(()=>{
        console.log('users very after',users.getCount(), users.getData().map(x=>x.object))
        console.log('messages very after',users.getCount(),messages.dataCache.length)
        console.log('summary',session.getData().map(x=>x.object))
        // node1.get('messages').clear()
        // setTimeout(()=>{
        //     console.log('summary',session.getData().map(x=>x.object))
            
        // }, 300)
    }, 200)
})

    



setTimeout(()=>{
    //node2.get('messages').reset()
}, 1000)

